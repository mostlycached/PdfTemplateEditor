import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';

/**
 * Extract PDF text using pdfjs-dist which is already installed
 */
export async function extractPdfText(filePath: string, maxPages: number = 5): Promise<string> {
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
    
    console.log("PDF File:", path.basename(filePath));
    console.log("PDF Metadata:", { 
      title, 
      author, 
      subject, 
      keywords, 
      totalPages, 
      creator 
    });
    
    // Create a base text extraction from the metadata
    let formattedText = `PDF Document Information:\n`;
    formattedText += `Title: ${title}\n`;
    formattedText += `Author: ${author}\n`;
    
    if (subject) {
      formattedText += `Subject: ${subject}\n`;
    }
    
    if (keywords) {
      formattedText += `Keywords: ${keywords}\n`;
    }
    
    formattedText += `Total Pages: ${totalPages}\n\n`;
    
    // Try to extract actual text content using pdfjs-dist
    try {
      // Dynamic import to avoid potential initialization issues
      const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf');
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`PDF loaded with ${pdfDocument.numPages} pages`);
      
      // Extract text from the first few pages
      let extractedTextParts = [];
      const pagesToExtract = Math.min(maxPages, pdfDocument.numPages);
      
      for (let i = 1; i <= pagesToExtract; i++) {
        try {
          const page = await pdfDocument.getPage(i);
          const textContent = await page.getTextContent();
          
          // Extract text items
          const textItems = textContent.items
            .filter(item => 'str' in item)
            .map(item => item.str)
            .join(' ');
            
          extractedTextParts.push(textItems);
          console.log(`Extracted page ${i} with ${textItems.length} characters`);
        } catch (pageError) {
          console.error(`Error extracting page ${i}:`, pageError);
          extractedTextParts.push(`[Error extracting page ${i}]`);
        }
      }
      
      const contentText = extractedTextParts.join('\n\n');
      formattedText += `--- Document Content ---\n\n${contentText}\n\n`;
      console.log(`Total text extracted: ${contentText.length} characters`);
    } catch (parseError) {
      console.error('Error extracting PDF text with pdfjs:', parseError);
      formattedText += `--- Document Content ---\n\n[Unable to extract full text content]\n\n`;
      
      // Add more context from the metadata even if extraction failed
      if (creator) {
        formattedText += `Created using: ${creator}\n`;
      }
      
      if (subject) {
        formattedText += `\nThe document covers: ${subject}\n`;
      }
    }
    
    // Add a specific instruction for better AI responses
    formattedText += `\nImportant: Please create a SPECIFIC title and subtitle for this document based on its actual content above. Be detailed and precise.\n`;
    
    console.log("Extracted text sample:", formattedText.substring(0, 300) + "...");
    return formattedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    return `Error extracting PDF information. Details: ${error.message}`;
  }
}