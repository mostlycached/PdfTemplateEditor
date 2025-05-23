import fs from 'fs/promises';

/**
 * A custom wrapper for the pdf-parse library that avoids the test file loading issue
 * @param filePath Path to the PDF file to parse
 * @param options Optional parsing options
 * @returns Extracted text from the PDF
 */
export async function parsePDF(filePath: string, options = {}): Promise<{ text: string }> {
  try {
    // Read the PDF file directly
    const pdfBuffer = await fs.readFile(filePath);
    
    // Use a dynamic import to avoid the initialization issue with pdf-parse
    const pdfParse = (await import('pdf-parse')).default;
    
    // Parse the PDF to extract text
    return await pdfParse(pdfBuffer, options);
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw error;
  }
}