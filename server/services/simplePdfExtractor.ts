import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

/**
 * A simplified function to extract text from PDFs
 * This uses a combination of metadata and a dynamic import approach
 * to avoid initialization issues with pdf-parse
 */
export async function extractFullPDFText(filePath: string, maxPages: number = 5): Promise<string> {
  try {
    // Read the PDF file
    const pdfBuffer = await fs.readFile(filePath);
    
    // Get metadata using pdf-lib
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || 'Untitled Document';
    const author = pdfDoc.getAuthor() || 'Unknown Author';
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';
    const creator = pdfDoc.getCreator() || '';
    
    console.log("PDF File:", filePath);
    console.log("PDF Metadata:", { 
      title, 
      author, 
      subject, 
      keywords, 
      totalPages, 
      creator 
    });
    
    // Try to extract actual text content safely with dynamic import
    let pdfText = '';
    try {
      // Dynamically import pdf-parse to avoid initialization issues
      const pdfParse = (await import('pdf-parse')).default;
      const result = await pdfParse(pdfBuffer, { max: maxPages });
      pdfText = result.text || '';
      console.log(`Successfully extracted ${pdfText.length} characters of text from PDF`);
    } catch (parseError) {
      console.error('Error parsing PDF text content:', parseError);
      pdfText = 'Unable to extract detailed text content from this PDF.';
    }
    
    // Create a comprehensive text representation with metadata and content
    let extractedText = `PDF Document Information:\n`;
    extractedText += `Title: ${title}\n`;
    extractedText += `Author: ${author}\n`;
    
    if (subject) {
      extractedText += `Subject: ${subject}\n`;
    }
    
    if (keywords) {
      extractedText += `Keywords: ${keywords}\n`;
    }
    
    extractedText += `Total Pages: ${totalPages}\n`;
    
    // Add extracted text content
    extractedText += `\n--- Document Content ---\n\n`;
    extractedText += pdfText;
    
    // Add a specific instruction for better AI responses
    extractedText += `\n\nImportant: Please create a SPECIFIC title and subtitle for this document based on its content. Do NOT generate generic titles like "Understanding PDF Creation" unless the document is actually about PDF creation.\n`;
    
    console.log("Extracted text sample:", extractedText.substring(0, 300) + "...");
    return extractedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return 'Unable to extract PDF information. Please generate specific, non-generic content based on the document subject matter.';
  }
}