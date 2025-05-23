import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';

/**
 * A simplified text extractor that uses metadata when full text extraction isn't working
 * @param filePath Path to the PDF file
 * @returns Basic metadata from the PDF
 */
export async function extractPDFInfo(filePath: string): Promise<string> {
  try {
    // Read the PDF file
    const pdfBuffer = await fs.readFile(filePath);
    
    // Get metadata using pdf-lib (which is more reliable in Node.js)
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const totalPages = pdfDoc.getPageCount();
    const title = pdfDoc.getTitle() || 'Untitled Document';
    const author = pdfDoc.getAuthor() || 'Unknown Author';
    const subject = pdfDoc.getSubject() || '';
    const keywords = pdfDoc.getKeywords() || '';
    const creator = pdfDoc.getCreator() || '';
    
    // Create a summary of the document
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
    
    // Add additional context about the document
    extractedText += `\nThis is a ${totalPages}-page document`;
    if (title !== 'Untitled Document') {
      extractedText += ` titled "${title}"`;
    }
    if (author !== 'Unknown Author') {
      extractedText += ` by ${author}`;
    }
    extractedText += '.\n';
    
    if (subject) {
      extractedText += `\nThe document covers: ${subject}\n`;
    }
    
    if (creator) {
      extractedText += `\nCreated using: ${creator}\n`;
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting PDF information:', error);
    return 'Unable to extract PDF information. Please generate professional content based on LinkedIn best practices.';
  }
}