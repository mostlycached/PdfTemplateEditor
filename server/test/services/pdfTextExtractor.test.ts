import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { extractTextFromPDF, extractFirstPageText } from '../../services/pdfTextExtractor';

describe('PDF Text Extractor', () => {
  const testPdfPath = path.join(__dirname, '../fixtures/sample.pdf');
  const testPdfDir = path.dirname(testPdfPath);

  beforeAll(async () => {
    // Create test fixtures directory if it doesn't exist
    await fs.mkdir(testPdfDir, { recursive: true });
    
    // Verify sample PDF exists in the repository
    try {
      await fs.access(testPdfPath);
    } catch (error) {
      throw new Error(`Sample PDF not found at ${testPdfPath}. Please ensure the test fixture exists.`);
    }
  });

  afterAll(async () => {
    // No cleanup needed since we're using the repository's sample PDF
  });

  describe('extractTextFromPDF', () => {
    it('should extract text from a PDF file with default maxPages', async () => {
      const result = await extractTextFromPDF(testPdfPath);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('Title:');
      expect(result).toContain('Author:');
      expect(result).toContain('--- Document Text (First');
      expect(result).toContain('pages) ---');
      // Should contain some content
      expect(result.length).toBeGreaterThan(50);
    });

    it('should extract text with custom maxPages limit', async () => {
      const result = await extractTextFromPDF(testPdfPath, 1);
      
      expect(result).toBeDefined();
      expect(result).toContain('--- Document Text (First 1 pages) ---');
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = path.join(__dirname, '../fixtures/non-existent.pdf');
      
      await expect(extractTextFromPDF(nonExistentPath)).rejects.toThrow();
    });

    it('should handle invalid PDF file gracefully', async () => {
      // Create a non-PDF file with .pdf extension
      const invalidPdfPath = path.join(__dirname, '../fixtures/invalid.pdf');
      await fs.writeFile(invalidPdfPath, 'This is not a PDF file');
      
      try {
        await expect(extractTextFromPDF(invalidPdfPath)).rejects.toThrow();
      } finally {
        await fs.unlink(invalidPdfPath);
      }
    });

    it('should include metadata structure in the output', async () => {
      const result = await extractTextFromPDF(testPdfPath);
      
      expect(result).toContain('Title:');
      expect(result).toContain('Author:');
      expect(result).toContain('--- Document Text (First');
    });
  });

  describe('extractFirstPageText', () => {
    it('should extract only the first page text', async () => {
      const result = await extractFirstPageText(testPdfPath);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('--- Document Text (First 1 pages) ---');
      expect(result).toContain('Title:');
    });

    it('should handle non-existent file gracefully', async () => {
      const nonExistentPath = path.join(__dirname, '../fixtures/non-existent.pdf');
      
      await expect(extractFirstPageText(nonExistentPath)).rejects.toThrow();
    });

    it('should return same result as extractTextFromPDF with maxPages=1', async () => {
      const firstPageResult = await extractFirstPageText(testPdfPath);
      const fullExtractionResult = await extractTextFromPDF(testPdfPath, 1);
      
      expect(firstPageResult).toBe(fullExtractionResult);
    });
  });

  describe('Edge Cases', () => {
    it('should handle maxPages of 0', async () => {
      const result = await extractTextFromPDF(testPdfPath, 0);
      
      expect(result).toBeDefined();
      expect(result).toContain('--- Document Text (First 0 pages) ---');
    });

    it('should handle maxPages larger than total pages', async () => {
      const result = await extractTextFromPDF(testPdfPath, 100);
      
      expect(result).toBeDefined();
      // Should still work without errors
      expect(result.length).toBeGreaterThan(50);
    });
  });

  describe('Mock Tests (always run)', () => {
    it('should export the functions correctly', () => {
      expect(typeof extractTextFromPDF).toBe('function');
      expect(typeof extractFirstPageText).toBe('function');
    });

    it('should reject with proper error for missing files', async () => {
      const nonExistentPath = '/path/that/does/not/exist.pdf';
      
      await expect(extractTextFromPDF(nonExistentPath)).rejects.toThrow();
      await expect(extractFirstPageText(nonExistentPath)).rejects.toThrow();
    });
  });
});
