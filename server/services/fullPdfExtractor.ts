import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';

/**
 * A robust implementation for extracting text from PDFs using pdf-parse
 * This handles the initialization issues with pdf-parse's test files
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
    
    console.log("PDF File:", path.basename(filePath));
    console.log("PDF Metadata:", { 
      title, 
      author, 
      subject, 
      keywords, 
      totalPages, 
      creator 
    });
    
    // Extract text using a direct approach without requiring test files
    let parsedText = '';
    try {
      // Use the PDF parser from pdfjs-dist which is already installed
      const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
      
      // Configure the worker with virtual file system
      const pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: pdfBuffer });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`PDF loaded with ${pdfDocument.numPages} pages`);
      
      // Extract text from the first few pages
      let extractedTextParts = [];
      const pagesToExtract = Math.min(maxPages, pdfDocument.numPages);
      
      for (let i = 1; i <= pagesToExtract; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text items
        const textItems = textContent.items.map(item => item.str).join(' ');
        extractedTextParts.push(textItems);
        
        console.log(`Extracted page ${i} with ${textItems.length} characters`);
      }
      
      parsedText = extractedTextParts.join('\n\n');
      console.log(`Total text extracted: ${parsedText.length} characters`);
    } catch (parseError) {
      console.error('Error extracting PDF text:', parseError);
      parsedText = 'Failed to extract text content. Using metadata only.';
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters of text from PDF`);
    
    // Format the output with metadata and content
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
    formattedText += `--- Document Content ---\n\n`;
    formattedText += extractedText;
    
    // Add a specific instruction for better AI responses
    formattedText += `\n\nImportant: Please create a SPECIFIC title and subtitle for this document based on its actual content above. Be detailed and precise.\n`;
    
    console.log("Extracted text sample:", formattedText.substring(0, 300) + "...");
    return formattedText;
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw error;
  }
}