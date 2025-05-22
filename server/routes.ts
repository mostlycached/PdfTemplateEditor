import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { cosmosStorage } from "./cosmosStorage";
import multer from "multer";
import path from "path";
import * as fs from "fs/promises";
import { existsSync, promises as fsPromises } from "fs";
import { insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { setupLinkedInAuth } from "./linkedinAuth";
import { seedTemplates } from "./seed";

// Setup upload directories
const setupDirectories = async () => {
  const dirs = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'uploads', 'pdfs'),
    path.resolve(process.cwd(), 'uploads', 'previews'),
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create directory ${dir}:`, err);
    }
  }
};

// Configure multer for file uploads
const storage_multer = multer.diskStorage({
  destination: async (req, file, cb) => {
    await setupDirectories();
    cb(null, path.resolve(process.cwd(), 'uploads', 'pdfs'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

// Helper function to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session && req.session.passport && req.session.passport.user) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup directories
  await setupDirectories();

  // Configure LinkedIn authentication
  setupLinkedInAuth(app);

  // API routes
  // Upload PDF file
  app.post('/api/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      let userId = null;
      if (req.session && req.session.passport && req.session.passport.user) {
        userId = req.session.passport.user;
      }

      const document = await cosmosStorage.createDocument({
        userId: userId,
        originalName: req.file.originalname,
        fileName: req.file.filename,
      });

      res.status(201).json({ 
        message: 'File uploaded successfully',
        documentId: document.id
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        message: 'Failed to upload file',
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Get document by ID
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Get document error:', error);
      res.status(500).json({ message: 'Failed to get document' });
    }
  });

  // Get recent documents for authenticated user
  app.get('/api/documents/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.session.passport.user;
      const documents = await cosmosStorage.getRecentDocuments(userId);
      res.json(documents);
    } catch (error) {
      console.error('Get recent documents error:', error);
      res.status(500).json({ message: 'Failed to get recent documents' });
    }
  });

  // Get document preview
  app.get('/api/documents/:id/preview', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const filePath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
      res.sendFile(filePath);
    } catch (error) {
      console.error('Preview error:', error);
      res.status(500).json({ message: 'Failed to get preview' });
    }
  });
  
  // Download original PDF (without modifications)
  app.get('/api/documents/:id/download-original', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const filePath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
      res.download(filePath, document.originalName);
    } catch (error) {
      console.error('Download original error:', error);
      res.status(500).json({ message: 'Failed to download original PDF' });
    }
  });

  // Customize document
  app.post('/api/documents/:id/customize', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      // Log the document ID we're trying to customize
      console.log('Attempting to customize document with ID:', documentId);

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        console.error('Document not found with ID:', documentId);
        return res.status(404).json({ message: 'Document not found' });
      }

      console.log('Retrieved document:', JSON.stringify(document));

      const { templateId, customizations } = req.body;
      if (!templateId || !customizations) {
        return res.status(400).json({ message: 'Template ID and customizations are required' });
      }

      const template = await cosmosStorage.getTemplate(templateId);
      if (!template) {
        console.error('Template not found with ID:', templateId);
        return res.status(404).json({ message: 'Template not found' });
      }

      console.log('Retrieved template:', JSON.stringify(template));

      // Store customizations in document
      const updatedCustomizations = {
        ...customizations,
        templateId,
      };

      await cosmosStorage.updateDocumentCustomizations(documentId, updatedCustomizations);
      console.log('Updated customizations successfully');
      
      // Also store customizations in the filesystem as a backup
      const customizationsPath = path.resolve(process.cwd(), 'uploads', 'customizations');
      let backupFileName = '';
      try {
        // Just always try to create the directory
        await fs.mkdir(customizationsPath, { recursive: true });
        
        backupFileName = path.resolve(customizationsPath, `doc-${documentId}.json`);
        await fs.writeFile(backupFileName, JSON.stringify(updatedCustomizations));
        console.log(`Saved customizations backup to ${backupFileName}`);
      } catch (fsError) {
        console.error("Error saving customizations backup:", fsError);
        // Continue even if this fails
      }

      // Ensure directories exist
      await setupDirectories();
      
      // Create a simple preview file directly
      const previewsDir = path.resolve(process.cwd(), 'uploads', 'previews');
      const previewPath = path.resolve(previewsDir, `cover-${documentId}.pdf`);
      
      try {
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([612, 792]); // US Letter size
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        
        // Add content to the PDF
        page.drawText(customizations.title || 'Title', {
          x: 50,
          y: 700,
          font,
          size: 24
        });
        
        page.drawText(customizations.subtitle || 'Subtitle', {
          x: 50,
          y: 670,
          font,
          size: 16
        });
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        await fs.writeFile(previewPath, pdfBytes);
        console.log('Created preview file at:', previewPath);
      } catch (previewError) {
        console.error('Error creating preview:', previewError);
        // Continue even if preview fails
      }

      res.json({ 
        message: 'Customizations applied successfully',
        previewUrl: `/api/documents/${documentId}/cover-preview`
      });
    } catch (error) {
      console.error('Customize error:', error);
      res.status(500).json({ message: 'Failed to customize document' });
    }
  });

  // Get customized cover preview
  app.get('/api/documents/:id/cover-preview', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const previewPath = path.resolve(process.cwd(), 'uploads', 'previews', `cover-${documentId}.pdf`);
      res.sendFile(previewPath);
    } catch (error) {
      console.error('Cover preview error:', error);
      res.status(500).json({ message: 'Failed to get cover preview' });
    }
  });

  // Download modified PDF
  app.get('/api/documents/:id/download', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      console.log(`Attempting to download document with ID: ${documentId}`);

      // First check if we have a customization record for this document
      const customizationsPath = path.resolve(process.cwd(), 'uploads', 'customizations');
      
      // Try to create the directory if it doesn't exist
      try {
        await fs.mkdir(customizationsPath, { recursive: true });
      } catch (mkdirError) {
        console.error(`Error creating customizations directory:`, mkdirError);
        // Continue anyway
      }
      
      const customizationsFile = path.resolve(customizationsPath, `doc-${documentId}.json`);
      let customizationsData = null;
      
      // Try to read the customizations data first from the filesystem as a backup
      try {
        try {
          await fs.access(customizationsFile);
          const data = await fs.readFile(customizationsFile, 'utf-8');
          customizationsData = JSON.parse(data);
          console.log(`Found customizations in file system:`, customizationsData);
        } catch (accessError) {
          // File doesn't exist, that's okay
          console.log(`No customizations file found at ${customizationsFile}`);
        }
      } catch (fsError) {
        console.error(`Error reading customizations file:`, fsError);
      }
      
      // Get the document from Cosmos DB
      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        console.error(`Document with ID ${documentId} not found for download`);
        return res.status(404).json({ message: 'Document not found' });
      }
      
      console.log(`Retrieved document for download:`, JSON.stringify(document));

      // Check if document has customizations - use filesystem backup if database version not available
      let documentCustomizations = document.customizations;
      
      if (!documentCustomizations && customizationsData) {
        console.log('Using customizations from filesystem backup');
        documentCustomizations = customizationsData;
        
        // Update the document in Cosmos DB with the backup customizations
        try {
          await cosmosStorage.updateDocumentCustomizations(documentId, documentCustomizations);
          console.log('Updated document in Cosmos DB with backup customizations');
        } catch (updateError) {
          console.error('Failed to update Cosmos DB with backup customizations:', updateError);
          // Continue with the backup data anyway
        }
      }
      
      if (!documentCustomizations) {
        console.log(`No customizations found, returning original file`);
        const filePath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
        return res.download(filePath, document.originalName);
      }

      // Generate the modified PDF with the custom cover page
      let customizations = documentCustomizations;
      try {
        // We don't need to parse again as our CosmosStorage class already handles this
        // but keep the type checking for safety
        if (typeof customizations === 'string') {
          customizations = JSON.parse(customizations);
          console.log(`Parsed customizations from string:`, customizations);
        }

        const templateId = customizations.templateId;
        console.log(`Looking for template with ID: ${templateId}`);
        
        const template = await cosmosStorage.getTemplate(templateId);
        if (!template) {
          console.error(`Template with ID ${templateId} not found`);
          return res.status(404).json({ message: 'Template not found' });
        }
        
        console.log(`Retrieved template:`, JSON.stringify(template));

        // Ensure directories exist
        await setupDirectories();
        
        const originalPdfPath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
        console.log(`Original PDF path: ${originalPdfPath}`);
        
        // Use the document ID for the modified file path
        const modifiedPdfPath = path.resolve(process.cwd(), 'uploads', 'pdfs', `modified-${documentId}.pdf`);
        console.log(`Modified PDF will be saved at: ${modifiedPdfPath}`);

        // Save a backup of the customizations to the filesystem
        try {
          await fs.writeFile(customizationsFile, JSON.stringify(customizations));
          console.log(`Saved customizations backup to ${customizationsFile}`);
        } catch (fsError) {
          console.error(`Error saving customizations backup:`, fsError);
          // Continue anyway as this is just a backup
        }

        // Generate a fresh modified PDF each time
        await generateModifiedPdf(originalPdfPath, modifiedPdfPath, template, customizations);
        console.log(`Modified PDF generated successfully`);

        res.download(modifiedPdfPath, document.originalName);
      } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Failed to download modified PDF' });
      }
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Failed to download modified PDF' });
    }
  });

  // Share to LinkedIn (placeholder - will need actual LinkedIn API integration)
  app.post('/api/documents/:id/share-linkedin', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // In a real implementation, you would use LinkedIn API to share the document
      // For now, we'll just return a success message
      res.json({ message: 'Document shared to LinkedIn successfully' });
    } catch (error) {
      console.error('Share error:', error);
      res.status(500).json({ message: 'Failed to share document to LinkedIn' });
    }
  });

  // Get templates
  app.get('/api/templates', async (req: Request, res: Response) => {
    try {
      const templates = await cosmosStorage.getAllTemplates();
      
      // Convert SVG paths to data URLs for immediate display
      const templatesWithDataURLs = templates.map(template => {
        // Create a basic colored rectangle for each template style
        let svgContent = '';
        
        switch(template.name) {
          case 'Corporate Blue':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#0055A4"/></svg>';
            break;
          case 'Modern Gradient':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#6a11cb"/><stop offset="100%" style="stop-color:#2575fc"/></linearGradient></defs><rect width="120" height="80" fill="url(#grad)"/></svg>';
            break;
          case 'Minimal White':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#FFFFFF" stroke="#E0E0E0" stroke-width="1"/></svg>';
            break;
          case 'Bold Red':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#FFFFFF"/><rect width="120" height="25" y="0" fill="#CC0000"/></svg>';
            break;
          case 'Elegant Black':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#000000"/></svg>';
            break;
          case 'Tech Blue':
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><defs><linearGradient id="techGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0575E6"/><stop offset="100%" style="stop-color:#021B79"/></linearGradient></defs><rect width="120" height="80" fill="url(#techGrad)"/></svg>';
            break;
          default:
            svgContent = '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="80" viewBox="0 0 120 80"><rect width="120" height="80" fill="#CCCCCC"/></svg>';
        }
        
        // Create a data URL for the SVG
        const dataURL = 'data:image/svg+xml;base64,' + Buffer.from(svgContent).toString('base64');
        
        return {
          ...template,
          imagePath: dataURL
        };
      });
      
      res.json(templatesWithDataURLs);
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: 'Failed to get templates' });
    }
  });

  // Analyze PDF for LinkedIn-optimized content using Azure OpenAI
  app.get('/api/documents/:id/analyze', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      // Get document from storage
      const document = await cosmosStorage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      // Import the simple PDF info extractor which is more reliable in Node.js
      const { extractPDFInfo } = await import('./services/simpleTextExtractor');

      // Get the full path to the PDF file
      const pdfPath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);

      // Extract PDF information
      const pdfText = await extractPDFInfo(pdfPath);

      // Check for Azure OpenAI API key
      const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
      const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;

      if (!azureApiKey || !azureEndpoint) {
        return res.status(400).json({ 
          message: 'Azure OpenAI API key or endpoint not configured',
          missingCredentials: true
        });
      }

      try {
        // Import the Azure OpenAI service
        const { analyzeWithAzureOpenAI } = await import('./services/azureOpenAI');
        
        // Use Azure OpenAI to analyze the PDF text and generate LinkedIn-optimized content
        const openAIAnalysis = await analyzeWithAzureOpenAI(pdfText, azureApiKey, azureEndpoint);
        
        // Combine the OpenAI analysis with our template customization format
        const suggestedValues = {
          title: openAIAnalysis.title || "Professional Presentation",
          subtitle: openAIAnalysis.subtitle || "Industry Insights & Analysis",
          presenter: openAIAnalysis.presenter || "",
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
          colorScheme: '#0077B5', // LinkedIn blue
          fontFamily: 'Roboto',
          titleSize: 'Medium',
          titleAlignment: 'center',
          backgroundStyle: 'gradient1',
          backgroundOpacity: 100
        };
        
        res.json({
          documentId,
          suggestedValues,
          analysis: {
            summary: openAIAnalysis.professionalSummary,
            keyPhrases: openAIAnalysis.keyPhrases
          }
        });
      } catch (azureError: any) {
        console.error('Azure OpenAI error:', azureError.response?.data || azureError.message);
        res.status(500).json({ 
          message: 'Error analyzing document with Azure OpenAI',
          error: azureError.message
        });
      }
    } catch (error) {
      console.error('Analyze document error:', error);
      res.status(500).json({ 
        message: 'Failed to analyze document',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Seed templates if none exist
  await seedTemplates();

  const httpServer = createServer(app);
  return httpServer;
}

// Helper function to generate a customized cover page preview
async function generateCustomizedCoverPreview(document: any, template: any, customizations: any) {
  try {
    // Check for document ID (handle both PostgreSQL and Cosmos DB formats)
    const docId = document.numericId || document.id;
    console.log('Generating preview for document ID:', docId);
    
    // Ensure uploads directories exist
    await setupDirectories();
    
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // US Letter size
    
    // Load a standard font
    const fontFamily = customizations.fontFamily || 'Helvetica';
    let font;
    switch (fontFamily) {
      case 'Roboto':
      case 'Open Sans':
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      case 'Montserrat':
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      case 'Playfair Display':
        font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
        break;
      case 'Raleway':
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      default:
        font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // Set background (simplified implementation)
    const { width, height } = page.getSize();
    
    // Convert color to rgb values (0-1)
    const colorHex = customizations.colorScheme || '#0077B5';
    const color = hexToRgb(colorHex);
    
    // Draw background
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1), // White background
    });
    
    // Add a colored header bar
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(color.r, color.g, color.b),
    });
    
    // Add title
    const titleSize = getTitleSize(customizations.titleSize);
    const titleX = getTitleX(customizations.titleAlignment, width);
    
    page.drawText(customizations.title || 'Presentation Title', {
      x: titleX,
      y: height - 200,
      font,
      size: titleSize,
      color: rgb(0, 0, 0),
    });
    
    // Add subtitle
    page.drawText(customizations.subtitle || 'Subtitle', {
      x: titleX,
      y: height - 230,
      font,
      size: 18,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add presenter name and date at the bottom
    if (customizations.presenter) {
      page.drawText(`Presented by: ${customizations.presenter}`, {
        x: 50,
        y: 100,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    if (customizations.date) {
      page.drawText(customizations.date, {
        x: 50,
        y: 70,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    // Save the preview - use numericId for Cosmos DB
    const pdfBytes = await pdfDoc.save();
    const docIdentifier = document.numericId || document.id;
    console.log('Using document ID for preview:', docIdentifier);
    
    // Ensure the previews directory exists
    const previewsDir = path.resolve(process.cwd(), 'uploads', 'previews');
    try {
      await fs.mkdir(previewsDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create previews directory: ${previewsDir}`, err);
    }
    
    // Use the document ID from either numericId or id
    const previewPath = path.resolve(previewsDir, `cover-${docId}.pdf`);
    await fs.writeFile(previewPath, pdfBytes);
    
    return previewPath;
  } catch (error) {
    console.error('Error generating cover preview:', error);
    throw error;
  }
}

// Helper function to generate the modified PDF with custom cover page
async function generateModifiedPdf(originalPdfPath: string, outputPath: string, template: any, customizations: any) {
  try {
    console.log("Starting PDF generation with the following inputs:");
    console.log("Original PDF path:", originalPdfPath);
    console.log("Output path:", outputPath);
    console.log("Template:", JSON.stringify(template));
    console.log("Customizations (raw):", JSON.stringify(customizations));
    
    // Ensure customizations is properly parsed (handle both string and object formats)
    let parsedCustomizations = customizations;
    if (typeof customizations === 'string') {
      try {
        parsedCustomizations = JSON.parse(customizations);
        console.log("Parsed customizations from string:", JSON.stringify(parsedCustomizations));
      } catch (parseError) {
        console.error("Error parsing customizations string:", parseError);
        // Continue with original customizations as fallback
      }
    }
    
    // Load the original PDF
    const originalPdfBytes = await fs.readFile(originalPdfPath);
    console.log(`Loaded original PDF (${originalPdfBytes.length} bytes)`);
    
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
    console.log(`Original PDF has ${originalPdfDoc.getPageCount()} pages`);
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    console.log("Created new PDF document");
    
    // Add customized cover page
    const coverPage = newPdfDoc.addPage([612, 792]); // US Letter size
    console.log("Added cover page to new PDF");
    
    // Load a standard font
    const fontFamily = parsedCustomizations.fontFamily || 'Helvetica';
    console.log(`Using font family: ${fontFamily}`);
    
    let font;
    switch (fontFamily) {
      case 'Roboto':
      case 'Open Sans':
        font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      case 'Montserrat':
        font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      case 'Playfair Display':
        font = await newPdfDoc.embedFont(StandardFonts.TimesRoman);
        break;
      case 'Raleway':
        font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
        break;
      default:
        font = await newPdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // Set background (simplified implementation)
    const { width, height } = coverPage.getSize();
    console.log(`Cover page size: ${width}x${height}`);
    
    // Convert color to rgb values (0-1)
    const colorHex = parsedCustomizations.colorScheme || '#0077B5';
    const color = hexToRgb(colorHex);
    console.log(`Using color: ${colorHex}, RGB: ${JSON.stringify(color)}`);
    
    // Apply different template styles based on template name
    switch (template.name) {
      case 'Corporate Blue':
        // Corporate Blue style - Blue header with white body
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1), // White background
        });
        
        // Blue header
        coverPage.drawRectangle({
          x: 0,
          y: height - 120,
          width,
          height: 120,
          color: rgb(0, 0.33, 0.64), // Corporate blue
        });
        
        // Title in white on blue background
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 70,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(1, 1, 1), // White text
        });
        
        // Subtitle in lighter color below title
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: 50,
          y: height - 150,
          font,
          size: 18,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        break;
        
      case 'Modern Gradient':
        // Modern Gradient - Can't do actual gradients in PDF-lib easily, so simulate with layered rectangles
        for (let i = 0; i < 10; i++) {
          const t = i / 9; // 0 to 1
          const r = 0.4 + 0.1 * t; // Gradient from purplish-blue to blue
          const g = 0.07 + 0.16 * t;
          const b = 0.8 - 0.1 * t;
          
          coverPage.drawRectangle({
            x: 0,
            y: i * (height / 10),
            width,
            height: height / 10,
            color: rgb(r, g, b)
          });
        }
        
        // White block for content area
        coverPage.drawRectangle({
          x: 50,
          y: 50,
          width: width - 100,
          height: height - 200,
          color: rgb(1, 1, 1) // White
        });
        
        // Title
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 80,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(1, 1, 1) // White text
        });
        
        // Subtitle
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 120,
          font,
          size: 18,
          color: rgb(1, 1, 1) // White text
        });
        
        break;
        
      case 'Minimal White':
        // Minimal White - Clean white background with subtle elements
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1), // White background
        });
        
        // Subtle light gray top border
        coverPage.drawRectangle({
          x: 0,
          y: height - 20,
          width,
          height: 20,
          color: rgb(0.95, 0.95, 0.95), // Very light gray
        });
        
        // Subtle accent line in the template color
        coverPage.drawRectangle({
          x: 50,
          y: height - 180,
          width: 100,
          height: 3,
          color: rgb(color.r, color.g, color.b),
        });
        
        // Title in dark text
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: 50,
          y: height - 140,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(0.2, 0.2, 0.2), // Dark gray text
        });
        
        // Subtitle in lighter color
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: 50,
          y: height - 180,
          font,
          size: 18,
          color: rgb(0.5, 0.5, 0.5), // Medium gray
        });
        
        break;
        
      case 'Bold Red':
        // Bold Red - Red accent with clean layout
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1), // White background
        });
        
        // Bold red header
        coverPage.drawRectangle({
          x: 0,
          y: height - 150,
          width,
          height: 150,
          color: rgb(0.8, 0, 0), // Bold red
        });
        
        // Title in white on red background
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 80,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(1, 1, 1), // White text
        });
        
        // Subtitle in white on red background
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 120,
          font, 
          size: 18,
          color: rgb(1, 1, 1) // White text
        });
        
        break;
        
      case 'Elegant Black':
        // Elegant Black - Dark and sophisticated
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.1, 0.1, 0.1), // Near black background
        });
        
        // Subtle darker header
        coverPage.drawRectangle({
          x: 0,
          y: height - 100,
          width,
          height: 100,
          color: rgb(0, 0, 0), // Pure black header
        });
        
        // Gold accent line
        coverPage.drawRectangle({
          x: 50,
          y: height - 130,
          width: 150,
          height: 2,
          color: rgb(0.85, 0.65, 0.2), // Gold accent
        });
        
        // Title in white/gold
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: 50,
          y: height - 60,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(0.95, 0.95, 0.95), // Off-white text
        });
        
        // Subtitle 
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: 50,
          y: height - 150,
          font,
          size: 18,
          color: rgb(0.85, 0.65, 0.2), // Gold text
        });
        
        break;
        
      case 'Tech Blue':
        // Tech Blue - Modern tech-inspired design with blue gradient
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(0.02, 0.1, 0.47), // Deep blue background
        });
        
        // Light blue abstract pattern at the top
        for (let i = 0; i < 5; i++) {
          coverPage.drawRectangle({
            x: 50 + (i * 20),
            y: height - 50 - (i * 15),
            width: 150,
            height: 3,
            color: rgb(0.05, 0.45, 0.9) // Light blue lines
          });
        }
        
        // White content area
        coverPage.drawRectangle({
          x: 40,
          y: 40,
          width: width - 80,
          height: height - 200,
          color: rgb(1, 1, 1) // White area
        });
        
        // Title in bright blue
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: 60,
          y: height - 180,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(1, 1, 1), // White text
        });
        
        // Subtitle
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: 60, 
          y: height - 220,
          font,
          size: 18,
          color: rgb(0.05, 0.45, 0.9), // Light blue text
        });
        
        break;
        
      default:
        // Default style as fallback - uses the selected colors
        coverPage.drawRectangle({
          x: 0,
          y: 0,
          width,
          height,
          color: rgb(1, 1, 1), // White background
        });
        
        // User selected color header
        coverPage.drawRectangle({
          x: 0,
          y: height - 100,
          width,
          height: 100,
          color: rgb(color.r, color.g, color.b), // User selected color
        });
        
        // Title
        coverPage.drawText(parsedCustomizations.title || 'Presentation Title', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 200,
          font,
          size: getTitleSize(parsedCustomizations.titleSize),
          color: rgb(0, 0, 0), // Black text
        });
        
        // Subtitle
        coverPage.drawText(parsedCustomizations.subtitle || 'Subtitle', {
          x: getTitleX(parsedCustomizations.titleAlignment, width),
          y: height - 230,
          font,
          size: 18,
          color: rgb(0.3, 0.3, 0.3), // Dark gray
        });
    }
    
    // Add presenter name and date at the bottom for all templates
    if (parsedCustomizations.presenter) {
      console.log(`Drawing presenter: "${parsedCustomizations.presenter}"`);
      coverPage.drawText(`Presented by: ${parsedCustomizations.presenter}`, {
        x: 50,
        y: 100,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    if (parsedCustomizations.date) {
      console.log(`Drawing date: "${parsedCustomizations.date}"`);
      coverPage.drawText(parsedCustomizations.date, {
        x: 50,
        y: 70,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    // Copy all pages from the original PDF (except the first one if wanted)
    const originalPageCount = originalPdfDoc.getPageCount();
    if (originalPageCount > 1) {
      console.log(`Copying ${originalPageCount - 1} pages from original PDF`);
      const copiedPages = await newPdfDoc.copyPages(
        originalPdfDoc, 
        Array.from({ length: originalPageCount - 1 }, (_, i) => i + 1)
      );
      
      copiedPages.forEach(page => {
        newPdfDoc.addPage(page);
      });
    } else {
      console.log('Original PDF has only one page, no additional pages to copy');
    }
    
    // Save the modified PDF
    console.log(`Saving modified PDF to ${outputPath}`);
    const pdfBytes = await newPdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    console.log(`Modified PDF saved (${pdfBytes.length} bytes)`);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate modified PDF: ${(error as Error).message}`);
  }
}

// Helper function to convert hex color to RGB
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

// Helper function to determine title size
function getTitleSize(titleSize?: string) {
  switch (titleSize) {
    case 'Small':
      return 24;
    case 'Medium':
      return 32;
    case 'Large':
      return 40;
    case 'Extra Large':
      return 48;
    default:
      return 32;
  }
}

// Helper function to determine title X position based on alignment
function getTitleX(alignment?: string, width = 612) {
  switch (alignment) {
    case 'left':
      return 50;
    case 'right':
      return width - 50;
    case 'center':
    default:
      return width / 2;
  }
}