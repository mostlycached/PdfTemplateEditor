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
    
    console.log("PDF File:", filePath);
    console.log("PDF Metadata:", { 
      title, 
      author, 
      subject, 
      keywords, 
      totalPages, 
      creator 
    });
    
    // Try to extract text from the first page for better analysis
    let pageText = "";
    try {
      const page = pdfDoc.getPages()[0];
      // Note: pdf-lib doesn't provide direct text extraction
      // We'll use the page dimensions as additional context
      const { width, height } = page.getSize();
      pageText = `\nThe first page has dimensions of ${width.toFixed(2)} x ${height.toFixed(2)} points.\n`;
    } catch (pageError) {
      console.error("Error extracting page info:", pageError);
    }
    
    // Create a more detailed summary of the document
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
    
    if (keywords) {
      extractedText += `\nDocument keywords: ${keywords}\n`;
    }
    
    if (creator) {
      extractedText += `\nCreated using: ${creator}\n`;
    }
    
    // Add the page text if available
    if (pageText) {
      extractedText += pageText;
    }
    
    // Add a specific instruction to avoid generic responses
    extractedText += `\nImportant: Please create a SPECIFIC title and subtitle for this document based on its metadata. Do NOT generate generic titles like "Understanding PDF Creation" unless the document is actually about PDF creation.\n`;
    
    console.log("Extracted text sample:", extractedText.substring(0, 300) + "...");
    return extractedText;
  } catch (error) {
    console.error('Error extracting PDF information:', error);
    return 'Unable to extract PDF information. Please generate specific, non-generic content based on the document subject matter.';
  }
}