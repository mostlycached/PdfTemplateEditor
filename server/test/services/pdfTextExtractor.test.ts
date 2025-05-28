import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { 
  extractTextFromPDF, 
  extractFirstPageText,
  analyzePDF,
  extractSlideContent,
  getSlideTemplateSuggestions,
  PDFAnalysis,
  PDFMetadata,
  PageContent
} from '../../services/pdfTextExtractor';

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
      console.warn('Could not load sample PDF, creating a mock test');
      // If the sample PDF doesn't exist, skip tests that require it
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
      expect(typeof analyzePDF).toBe('function');
      expect(typeof extractSlideContent).toBe('function');
      expect(typeof getSlideTemplateSuggestions).toBe('function');
    });

    it('should reject with proper error for missing files', async () => {
      const nonExistentPath = '/path/that/does/not/exist.pdf';
      
      await expect(extractTextFromPDF(nonExistentPath)).rejects.toThrow();
      await expect(extractFirstPageText(nonExistentPath)).rejects.toThrow();
    });
  });

  describe('Enhanced PDF Analysis', () => {
    it('should analyze PDF and return comprehensive metadata', async () => {
      const analysis = await analyzePDF(testPdfPath);
      
      expect(analysis).toBeDefined();
      expect(analysis.metadata).toBeDefined();
      expect(analysis.pages).toBeDefined();
      expect(analysis.totalText).toBeDefined();
      expect(analysis.summary).toBeDefined();
      
      // Check metadata structure
      expect(typeof analysis.metadata.title).toBe('string');
      expect(typeof analysis.metadata.author).toBe('string');
      expect(typeof analysis.metadata.pageCount).toBe('number');
      expect(typeof analysis.metadata.fileSize).toBe('number');
      
      // Check pages structure
      expect(Array.isArray(analysis.pages)).toBe(true);
      expect(analysis.pages.length).toBeGreaterThan(0);
      
      // Check first page structure
      const firstPage = analysis.pages[0];
      expect(firstPage.pageNumber).toBe(1);
      expect(typeof firstPage.text).toBe('string');
      expect(typeof firstPage.wordCount).toBe('number');
      expect(typeof firstPage.hasImages).toBe('boolean');
      expect(firstPage.dimensions).toBeDefined();
      expect(typeof firstPage.dimensions.width).toBe('number');
      expect(typeof firstPage.dimensions.height).toBe('number');
      
      // Check summary structure
      expect(typeof analysis.summary.totalWords).toBe('number');
      expect(typeof analysis.summary.averageWordsPerPage).toBe('number');
      expect(typeof analysis.summary.hasImages).toBe('boolean');
      expect(typeof analysis.summary.isSlideshow).toBe('boolean');
      expect(['title', 'content', 'mixed', 'unknown']).toContain(analysis.summary.suggestedSlideType);
    });

    it('should extract slide content for template generation', async () => {
      const slideContent = await extractSlideContent(testPdfPath);
      
      expect(slideContent).toBeDefined();
      expect(typeof slideContent.title).toBe('string');
      expect(typeof slideContent.subtitle).toBe('string');
      expect(Array.isArray(slideContent.content)).toBe(true);
      expect(slideContent.metadata).toBeDefined();
      
      // Should have meaningful content
      expect(slideContent.title.length).toBeGreaterThan(0);
    });

    it('should extract slide content from specific page', async () => {
      const slideContent = await extractSlideContent(testPdfPath, 1);
      
      expect(slideContent).toBeDefined();
      expect(slideContent.metadata.pageCount).toBeGreaterThan(0);
    });

    it('should handle non-existent page number gracefully', async () => {
      await expect(extractSlideContent(testPdfPath, 999)).rejects.toThrow('Page 999 not found in PDF');
    });

    it('should provide template suggestions based on content', async () => {
      const suggestions = await getSlideTemplateSuggestions(testPdfPath);
      
      expect(suggestions).toBeDefined();
      expect(['modern', 'corporate', 'creative', 'elegant']).toContain(suggestions.suggestedTemplate);
      expect(Array.isArray(suggestions.reasons)).toBe(true);
      expect(suggestions.analysis).toBeDefined();
      
      // Should provide at least one reason for the suggestion
      expect(suggestions.reasons.length).toBeGreaterThan(0);
    });

    it('should detect slideshow characteristics', async () => {
      const analysis = await analyzePDF(testPdfPath);
      
      // The analysis should include slideshow detection
      expect(typeof analysis.summary.isSlideshow).toBe('boolean');
      
      // Should suggest appropriate slide type
      expect(['title', 'content', 'mixed', 'unknown']).toContain(analysis.summary.suggestedSlideType);
    });

    it('should handle malformed PDF files in analysis', async () => {
      const invalidPdfPath = path.join(__dirname, '../fixtures/invalid-analysis.pdf');
      await fs.writeFile(invalidPdfPath, 'Not a real PDF content for analysis');
      
      try {
        await expect(analyzePDF(invalidPdfPath)).rejects.toThrow();
      } finally {
        await fs.unlink(invalidPdfPath);
      }
    });

    it('should calculate word counts correctly', async () => {
      const analysis = await analyzePDF(testPdfPath);
      
      expect(analysis.summary.totalWords).toBeGreaterThan(0);
      expect(analysis.summary.averageWordsPerPage).toBeGreaterThan(0);
      
      // Verify calculation
      const calculatedTotal = analysis.pages.reduce((sum, page) => sum + page.wordCount, 0);
      expect(analysis.summary.totalWords).toBe(calculatedTotal);
      
      const calculatedAverage = calculatedTotal / analysis.pages.length;
      expect(Math.abs(analysis.summary.averageWordsPerPage - calculatedAverage)).toBeLessThan(0.01);
    });

    it('should provide detailed metadata information', async () => {
      const analysis = await analyzePDF(testPdfPath);
      const metadata = analysis.metadata;
      
      // Should have required fields
      expect(metadata.title).toBeDefined();
      expect(metadata.author).toBeDefined();
      expect(metadata.pageCount).toBeGreaterThan(0);
      expect(metadata.fileSize).toBeGreaterThan(0);
      
      // Dates should be Date objects or null
      if (metadata.creationDate) {
        expect(metadata.creationDate).toBeInstanceOf(Date);
      }
      if (metadata.modificationDate) {
        expect(metadata.modificationDate).toBeInstanceOf(Date);
      }
    });
  });
});
