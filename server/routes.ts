import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
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

      const document = await storage.createDocument({
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

      const document = await storage.getDocument(documentId);
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
      const documents = await storage.getRecentDocuments(userId);
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

      const document = await storage.getDocument(documentId);
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

  // Customize document
  app.post('/api/documents/:id/customize', async (req: Request, res: Response) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const { templateId, customizations } = req.body;
      if (!templateId || !customizations) {
        return res.status(400).json({ message: 'Template ID and customizations are required' });
      }

      const template = await storage.getTemplate(templateId);
      if (!template) {
        return res.status(404).json({ message: 'Template not found' });
      }

      // Store customizations in document
      const updatedCustomizations = {
        ...customizations,
        templateId,
      };

      await storage.updateDocumentCustomizations(documentId, updatedCustomizations);

      // Generate a preview of the customized cover page
      const previewPath = await generateCustomizedCoverPreview(document, template, customizations);

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

      const document = await storage.getDocument(documentId);
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

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: 'Document not found' });
      }

      if (!document.customizations) {
        // If no customizations, just return the original file
        const filePath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
        return res.download(filePath, document.originalName);
      }

      // Generate the modified PDF with the custom cover page
      let customizations;
      try {
        // Handle both string and object formats of customizations
        if (typeof document.customizations === 'string') {
          customizations = JSON.parse(document.customizations);
        } else {
          customizations = document.customizations;
        }

        const template = await storage.getTemplate(customizations.templateId);
        if (!template) {
          return res.status(404).json({ message: 'Template not found' });
        }

        const originalPdfPath = path.resolve(process.cwd(), 'uploads', 'pdfs', document.fileName);
        const modifiedPdfPath = path.resolve(process.cwd(), 'uploads', 'pdfs', `modified-${document.id}.pdf`);

        await generateModifiedPdf(originalPdfPath, modifiedPdfPath, template, customizations);

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

      const document = await storage.getDocument(documentId);
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
      const templates = await storage.getAllTemplates();
      res.json(templates);
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
      const document = await storage.getDocument(documentId);
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
    
    // Save the preview
    const pdfBytes = await pdfDoc.save();
    const previewPath = path.resolve(process.cwd(), 'uploads', 'previews', `cover-${document.id}.pdf`);
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
    // Load the original PDF
    const originalPdfBytes = await fs.readFile(originalPdfPath);
    const originalPdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Create a new PDF document
    const newPdfDoc = await PDFDocument.create();
    
    // Add customized cover page
    const coverPage = newPdfDoc.addPage([612, 792]); // US Letter size
    
    // Load a standard font
    const fontFamily = customizations.fontFamily || 'Helvetica';
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
    
    // Convert color to rgb values (0-1)
    const colorHex = customizations.colorScheme || '#0077B5';
    const color = hexToRgb(colorHex);
    
    // Draw background
    coverPage.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(1, 1, 1), // White background
    });
    
    // Add a colored header bar
    coverPage.drawRectangle({
      x: 0,
      y: height - 100,
      width,
      height: 100,
      color: rgb(color.r, color.g, color.b),
    });
    
    // Add title
    const titleSize = getTitleSize(customizations.titleSize);
    const titleX = getTitleX(customizations.titleAlignment, width);
    
    coverPage.drawText(customizations.title || 'Presentation Title', {
      x: titleX,
      y: height - 200,
      font,
      size: titleSize,
      color: rgb(0, 0, 0),
    });
    
    // Add subtitle
    coverPage.drawText(customizations.subtitle || 'Subtitle', {
      x: titleX,
      y: height - 230,
      font,
      size: 18,
      color: rgb(0.3, 0.3, 0.3),
    });
    
    // Add presenter name and date at the bottom
    if (customizations.presenter) {
      coverPage.drawText(`Presented by: ${customizations.presenter}`, {
        x: 50,
        y: 100,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    if (customizations.date) {
      coverPage.drawText(customizations.date, {
        x: 50,
        y: 70,
        font,
        size: 14,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
    
    // Copy all pages except first from original PDF
    if (originalPdfDoc.getPageCount() > 1) {
      const pageIndices = Array.from({ length: originalPdfDoc.getPageCount() - 1 }, (_, i) => i + 1);
      const copiedPages = await newPdfDoc.copyPages(originalPdfDoc, pageIndices);
      copiedPages.forEach(page => {
        newPdfDoc.addPage(page);
      });
    }
    
    // Save the modified PDF
    const pdfBytes = await newPdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    
    return outputPath;
  } catch (error) {
    console.error('Error generating modified PDF:', error);
    throw error;
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