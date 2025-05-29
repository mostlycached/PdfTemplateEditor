import fs from 'fs/promises';
import path from 'path';
import { PDFDocument, PDFPage } from 'pdf-lib';

// Use dynamic import to avoid the test file loading issue
let pdfParse: any = null;

async function getPdfParse() {
  if (!pdfParse) {
    try {
      // Try to import pdf-parse dynamically
      const module = await import('pdf-parse');
      pdfParse = module.default || module;
    } catch (error) {
      console.error('Failed to load pdf-parse, falling back to metadata extraction:', error);
      // Return a fallback function that extracts basic metadata
      return async (buffer: Buffer) => ({
        text: 'Text extraction unavailable - using metadata only',
        numpages: 1,
        info: {},
        metadata: null,
        version: '1.0'
      });
    }
  }
  return pdfParse;
}

export interface PDFMetadata {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate: Date | null;
  modificationDate: Date | null;
  pageCount: number;
  fileSize: number;
}

export interface PageContent {
  pageNumber: number;
  text: string;
  wordCount: number;
  hasImages: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface PDFAnalysis {
  metadata: PDFMetadata;
  pages: PageContent[];
  totalText: string;
  summary: {
    totalWords: number;
    averageWordsPerPage: number;
    hasImages: boolean;
    isSlideshow: boolean;
    suggestedSlideType: 'title' | 'content' | 'mixed' | 'unknown';
  };
}

/**
 * Enhanced PDF analysis function that extracts comprehensive information
 * @param filePath Path to the PDF file
 * @returns Complete PDF analysis including metadata, page content, and suggestions
 */
export async function analyzePDF(filePath: string): Promise<PDFAnalysis> {
  try {
    const pdfBuffer = await fs.readFile(filePath);
    const fileStats = await fs.stat(filePath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Extract comprehensive metadata
    const metadata: PDFMetadata = {
      title: pdfDoc.getTitle() || 'Untitled Document',
      author: pdfDoc.getAuthor() || 'Unknown Author',
      subject: pdfDoc.getSubject() || '',
      keywords: pdfDoc.getKeywords() || '',
      creator: pdfDoc.getCreator() || '',
      producer: pdfDoc.getProducer() || '',
      creationDate: pdfDoc.getCreationDate() || null,
      modificationDate: pdfDoc.getModificationDate() || null,
      pageCount: pdfDoc.getPageCount(),
      fileSize: fileStats.size
    };

    console.log(`Analyzing PDF "${path.basename(filePath)}" - ${metadata.pageCount} pages`);

    // Extract text from all pages using pdf-parse
    const pdfParseFunc = await getPdfParse();
    const pdfData = await pdfParseFunc(pdfBuffer);
    const totalText = pdfData.text;

    // Get individual page content and analysis
    const pages: PageContent[] = [];
    const pdfPages = pdfDoc.getPages();
    
    for (let i = 0; i < pdfPages.length; i++) {
      const page = pdfPages[i];
      const { width, height } = page.getSize();
      
      // Extract text for this specific page
      const pageText = await extractPageText(pdfBuffer, i + 1);
      const wordCount = countWords(pageText);
      
      // Check for images (simplified - in reality would need more complex analysis)
      const hasImages = await checkPageForImages(page);
      
      pages.push({
        pageNumber: i + 1,
        text: pageText,
        wordCount,
        hasImages,
        dimensions: { width, height }
      });
    }

    // Generate summary and analysis
    const totalWords = pages.reduce((sum, page) => sum + page.wordCount, 0);
    const averageWordsPerPage = totalWords / pages.length;
    const hasImages = pages.some(page => page.hasImages);
    
    // Determine if this looks like a slideshow presentation
    const isSlideshow = detectSlideshow(pages, metadata);
    const suggestedSlideType = suggestSlideType(pages[0], totalText);

    return {
      metadata,
      pages,
      totalText,
      summary: {
        totalWords,
        averageWordsPerPage,
        hasImages,
        isSlideshow,
        suggestedSlideType
      }
    };
  } catch (error) {
    console.error('Error analyzing PDF:', error);
    throw error;
  }
}

/**
 * Extract text from a specific page of the PDF
 * @param pdfBuffer PDF file buffer
 * @param pageNumber Page number (1-indexed)
 * @returns Text content of the specified page
 */
async function extractPageText(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
  try {
    const options = {
      first: pageNumber,
      last: pageNumber
    };
    
    const pdfParseFunc = await getPdfParse();
    const data = await pdfParseFunc(pdfBuffer, options);
    return data.text || '';
  } catch (error) {
    console.warn(`Failed to extract text from page ${pageNumber}:`, error);
    return '';
  }
}

/**
 * Check if a page contains images (simplified detection)
 * @param page PDFPage object
 * @returns Boolean indicating if images are detected
 */
async function checkPageForImages(page: PDFPage): Promise<boolean> {
  try {
    // This is a simplified check - in practice, you'd analyze the page's content stream
    // For now, we'll check if the page has any XObject resources which might be images
    const resources = page.node.Resources;
    if (resources && resources.XObject) {
      return Object.keys(resources.XObject).length > 0;
    }
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Detect if the PDF appears to be a slideshow presentation
 * @param pages Array of page content
 * @param metadata PDF metadata
 * @returns Boolean indicating if this appears to be a slideshow
 */
function detectSlideshow(pages: PageContent[], metadata: PDFMetadata): boolean {
  // Heuristics for slideshow detection:
  // 1. Low average word count per page (typical for slides)
  // 2. Consistent page dimensions (landscape often indicates slides)
  // 3. Keywords in metadata suggesting presentation
  // 4. Multiple pages with similar formatting
  
  const avgWords = pages.reduce((sum, page) => sum + page.wordCount, 0) / pages.length;
  const isLandscape = pages.length > 0 && pages[0].dimensions.width > pages[0].dimensions.height;
  const hasSlideKeywords = /presentation|slide|deck|powerpoint|keynote/i.test(
    `${metadata.title} ${metadata.subject} ${metadata.keywords}`
  );
  
  return avgWords < 200 || isLandscape || hasSlideKeywords;
}

/**
 * Suggest the type of slide based on first page content
 * @param firstPage First page content
 * @param totalText Complete document text
 * @returns Suggested slide type
 */
function suggestSlideType(firstPage: PageContent, totalText: string): 'title' | 'content' | 'mixed' | 'unknown' {
  if (!firstPage || !firstPage.text) return 'unknown';
  
  const text = firstPage.text.toLowerCase();
  const lines = firstPage.text.split('\n').filter(line => line.trim().length > 0);
  
  // Title slide indicators
  if (firstPage.wordCount < 50 && lines.length <= 5) {
    return 'title';
  }
  
  // Content slide indicators
  if (firstPage.wordCount > 100 && lines.length > 10) {
    return 'content';
  }
  
  // Mixed content
  if (firstPage.wordCount >= 50 && firstPage.wordCount <= 100) {
    return 'mixed';
  }
  
  return 'unknown';
}

/**
 * Count words in a text string
 * @param text Input text
 * @returns Number of words
 */
function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}
/**
 * Extracts text content from a PDF file using pdf-parse library
 * @param filePath Path to the PDF file
 * @param maxPages Maximum number of pages to extract (default: 3)
 * @returns A string containing the extracted text
 */
export async function extractTextFromPDF(filePath: string, maxPages: number = 3): Promise<string> {
  try {
    // Read the PDF file
    const pdfBuffer = await fs.readFile(filePath);
    
    // Get metadata from pdf-lib for additional context
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || 'Untitled Document';
    const author = pdfDoc.getAuthor() || 'Unknown Author';
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';
    
    // Log some info about the extraction
    console.log(`Extracting text from PDF "${path.basename(filePath)}" - ${totalPages} total pages`);
    console.log(`Will extract up to ${maxPages} pages`);
    
    // Options for pdf-parse
    const options = {
      // Limit extraction to specified number of pages
      max: maxPages
    };
    
    // Parse the PDF to extract text
    const pdfParseFunc = await getPdfParse();
    const data = await pdfParseFunc(pdfBuffer, options);
    
    // Create a formatted text representation with metadata and content
    let extractedText = `Title: ${title}\nAuthor: ${author}\n`;
    
    if (subject) {
      extractedText += `Subject: ${subject}\n`;
    }
    
    if (keywords) {
      extractedText += `Keywords: ${keywords}\n`;
    }
    
    extractedText += `\n--- Document Text (First ${Math.min(maxPages, totalPages)} pages) ---\n\n`;
    extractedText += data.text;
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw error;
  }
}

/**
 * Extracts text from the first page of a PDF
 * @param filePath Path to the PDF file
 * @returns Text content of the first page
 */
export async function extractFirstPageText(filePath: string): Promise<string> {
  try {
    // Use the full extraction method but limit to 1 page
    return extractTextFromPDF(filePath, 1);
  } catch (error) {
    console.error('Error extracting first page text from PDF:', error);
    throw error;
  }
}

/**
 * Extract slide content suitable for template generation
 * @param filePath Path to the PDF file
 * @param pageNumber Specific page to extract (1-indexed), defaults to first page
 * @returns Structured slide content
 */
export async function extractSlideContent(filePath: string, pageNumber: number = 1): Promise<{
  title: string;
  subtitle: string;
  content: string[];
  metadata: Partial<PDFMetadata>;
}> {
  try {
    const analysis = await analyzePDF(filePath);
    const targetPage = analysis.pages[pageNumber - 1];
    
    if (!targetPage) {
      throw new Error(`Page ${pageNumber} not found in PDF`);
    }
    
    // Parse the page text to extract slide components
    const lines = targetPage.text.split('\n').filter(line => line.trim().length > 0);
    const title = lines[0] || 'Untitled Slide';
    const subtitle = lines[1] || '';
    const content = lines.slice(2);
    
    return {
      title: title.trim(),
      subtitle: subtitle.trim(),
      content: content.map(line => line.trim()),
      metadata: {
        title: analysis.metadata.title,
        author: analysis.metadata.author,
        pageCount: analysis.metadata.pageCount,
        isSlideshow: analysis.summary.isSlideshow
      }
    };
  } catch (error) {
    console.error('Error extracting slide content:', error);
    throw error;
  }
}

/**
 * Get suggestions for slide template based on PDF content
 * @param filePath Path to the PDF file
 * @returns Template suggestions and content analysis
 */
export async function getSlideTemplateSuggestions(filePath: string): Promise<{
  suggestedTemplate: 'modern' | 'corporate' | 'creative' | 'elegant';
  reasons: string[];
  analysis: PDFAnalysis;
}> {
  try {
    const analysis = await analyzePDF(filePath);
    const firstPage = analysis.pages[0];
    
    let suggestedTemplate: 'modern' | 'corporate' | 'creative' | 'elegant' = 'modern';
    const reasons: string[] = [];
    
    // Template suggestion logic based on content analysis
    if (analysis.summary.isSlideshow) {
      if (analysis.metadata.keywords.toLowerCase().includes('business') || 
          analysis.metadata.title.toLowerCase().includes('business')) {
        suggestedTemplate = 'corporate';
        reasons.push('Business-related keywords detected');
      } else if (firstPage.hasImages || analysis.summary.hasImages) {
        suggestedTemplate = 'creative';
        reasons.push('Visual content detected');
      } else if (analysis.summary.averageWordsPerPage < 50) {
        suggestedTemplate = 'elegant';
        reasons.push('Minimal text suggests elegant design');
      } else {
        suggestedTemplate = 'modern';
        reasons.push('Clean, modern approach recommended');
      }
    } else {
      // For non-slideshow documents
      if (analysis.summary.averageWordsPerPage > 200) {
        suggestedTemplate = 'corporate';
        reasons.push('Text-heavy content suits corporate style');
      } else {
        suggestedTemplate = 'modern';
        reasons.push('Document structure suits modern template');
      }
    }
    
    return {
      suggestedTemplate,
      reasons,
      analysis
    };
  } catch (error) {
    console.error('Error getting template suggestions:', error);
    throw error;
  }
}