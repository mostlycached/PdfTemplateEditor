import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
// Use our custom PDF parser to avoid test file loading issues
import { parsePDF } from './pdfParser';

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
    
    // Parse the PDF to extract text using our custom parser
    const data = await parsePDF(filePath, options);
    
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