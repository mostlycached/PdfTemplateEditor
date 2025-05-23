import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import * as path from 'path';

/**
 * Extract PDF text using pdfjs-dist
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
    
    // For now, add any additional context we have
    if (creator) {
      formattedText += `Created using: ${creator}\n`;
    }
    
    // Extract first page dimensions as additional context
    try {
      const page = pdfDoc.getPages()[0];
      const { width, height } = page.getSize();
      formattedText += `\nPage dimensions: ${width.toFixed(2)} x ${height.toFixed(2)} points\n`;
    } catch (pageError) {
      console.error("Error getting page dimensions:", pageError);
    }
    
    // Add specific instructions for the AI to generate better content
    formattedText += `\nPlease analyze this PDF document thoroughly.`;
    formattedText += `\nGenerate a highly specific, detailed title and subtitle based on:`;
    formattedText += `\n1. The document's subject: "${subject || 'Unknown'}"`;
    formattedText += `\n2. The creator: "${creator || 'Unknown'}"`;
    formattedText += `\n3. The keywords: "${keywords || 'None available'}"`;
    formattedText += `\n4. The fact that this is a ${totalPages}-page document`;
    
    if (title !== 'Untitled Document') {
      formattedText += `\n5. The original title: "${title}"`;
    }
    
    formattedText += `\n\nIMPORTANT: Be highly specific to this document's actual content.`;
    formattedText += `\nDO NOT generate generic titles like "Understanding PDF Creation" unless this document is specifically about PDF creation technology.`;
    
    console.log("Formatted text sample:", formattedText.substring(0, 300) + "...");
    return formattedText;
  } catch (error: any) {
    console.error('PDF extraction error:', error);
    return `Error extracting PDF information. Details: ${error.message || 'Unknown error'}`;
  }
}