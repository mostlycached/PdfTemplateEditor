// This file includes utility functions for working with PDFs

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

// Function to get a PDF as an ArrayBuffer
export async function getPdfArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

// Function to extract the first page of a PDF
export async function extractFirstPage(pdfArrayBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const firstPage = pdfDoc.getPages()[0];
    
    // Create a new document with just the first page
    const newPdfDoc = await PDFDocument.create();
    const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(copiedPage);
    
    return await newPdfDoc.save();
  } catch (error) {
    console.error('Error extracting first page:', error);
    throw error;
  }
}

// Function to extract all pages except the first
export async function extractRestOfPages(pdfArrayBuffer: ArrayBuffer): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    if (pageCount <= 1) {
      return new Uint8Array();
    }
    
    // Create a new document with all pages except the first
    const newPdfDoc = await PDFDocument.create();
    const pageIndices = Array.from({ length: pageCount - 1 }, (_, i) => i + 1);
    const copiedPages = await newPdfDoc.copyPages(pdfDoc, pageIndices);
    
    copiedPages.forEach(page => {
      newPdfDoc.addPage(page);
    });
    
    return await newPdfDoc.save();
  } catch (error) {
    console.error('Error extracting rest of pages:', error);
    throw error;
  }
}

// Function to convert RGB hex to RGB values (0-1)
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}
