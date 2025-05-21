import fs from 'fs/promises';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Initialize pdf.js worker
const pdfjsWorker = require('pdfjs-dist/build/pdf.worker.js');
if (typeof window === 'undefined') {
  // Server-side
  const pdfjsPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
  const pdfWorkerPath = path.join(pdfjsPath, 'build', 'pdf.worker.js');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerPath;
}

/**
 * Extracts text content from a PDF file
 * @param filePath Path to the PDF file
 * @returns A string containing the extracted text
 */
export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read file as ArrayBuffer
    const data = await fs.readFile(filePath);
    const arrayBuffer = data.buffer;
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    // Iterate through pages
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Concatenate text items with spaces
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    return fullText;
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
    // Read file as ArrayBuffer
    const data = await fs.readFile(filePath);
    const arrayBuffer = data.buffer;
    
    // Load the PDF document
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdfDocument = await loadingTask.promise;
    
    // Get the first page
    const page = await pdfDocument.getPage(1);
    const textContent = await page.getTextContent();
    
    // Concatenate text items with spaces
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    
    return pageText;
  } catch (error) {
    console.error('Error extracting first page text from PDF:', error);
    throw error;
  }
}