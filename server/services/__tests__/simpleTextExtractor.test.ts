import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { extractPDFInfo } from '../simpleTextExtractor';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('pdf-lib');

describe('Simple Text Extractor', () => {
  const mockFilePath = '/test/path/document.pdf';
  const mockPdfBuffer = Buffer.from('mock pdf content');
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractPDFInfo', () => {
    it('should extract complete PDF metadata and generate summary', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(15),
        getTitle: vi.fn().mockReturnValue('Complete Business Report'),
        getAuthor: vi.fn().mockReturnValue('Jane Smith'),
        getSubject: vi.fn().mockReturnValue('Annual financial analysis and projections'),
        getKeywords: vi.fn().mockReturnValue('finance, business, analysis, annual'),
        getCreator: vi.fn().mockReturnValue('Microsoft Word')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
      expect(PDFDocument.load).toHaveBeenCalledWith(mockPdfBuffer);
      
      expect(result).toContain('PDF Document Information:');
      expect(result).toContain('Title: Complete Business Report');
      expect(result).toContain('Author: Jane Smith');
      expect(result).toContain('Subject: Annual financial analysis and projections');
      expect(result).toContain('Keywords: finance, business, analysis, annual');
      expect(result).toContain('Total Pages: 15');
      expect(result).toContain('This is a 15-page document titled "Complete Business Report" by Jane Smith.');
      expect(result).toContain('The document covers: Annual financial analysis and projections');
      expect(result).toContain('Created using: Microsoft Word');
    });

    it('should handle PDF with minimal metadata gracefully', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(1),
        getTitle: vi.fn().mockReturnValue(null),
        getAuthor: vi.fn().mockReturnValue(null),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue(''),
        getCreator: vi.fn().mockReturnValue('')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('Title: Untitled Document');
      expect(result).toContain('Author: Unknown Author');
      expect(result).toContain('Total Pages: 1');
      expect(result).toContain('This is a 1-page document.');
      expect(result).not.toContain('Subject:');
      expect(result).not.toContain('Keywords:');
      expect(result).not.toContain('The document covers:');
      expect(result).not.toContain('Created using:');
    });

    it('should handle PDF with partial metadata', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(5),
        getTitle: vi.fn().mockReturnValue('Research Paper'),
        getAuthor: vi.fn().mockReturnValue('Dr. Wilson'),
        getSubject: vi.fn().mockReturnValue('Climate change impacts'),
        getKeywords: vi.fn().mockReturnValue(''),
        getCreator: vi.fn().mockReturnValue('')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('Title: Research Paper');
      expect(result).toContain('Author: Dr. Wilson');
      expect(result).toContain('Subject: Climate change impacts');
      expect(result).toContain('This is a 5-page document titled "Research Paper" by Dr. Wilson.');
      expect(result).toContain('The document covers: Climate change impacts');
      expect(result).not.toContain('Keywords:');
      expect(result).not.toContain('Created using:');
    });

    it('should handle single page documents correctly', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(1),
        getTitle: vi.fn().mockReturnValue('One Page Summary'),
        getAuthor: vi.fn().mockReturnValue('Quick Author'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue(''),
        getCreator: vi.fn().mockReturnValue('')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('Total Pages: 1');
      expect(result).toContain('This is a 1-page document titled "One Page Summary" by Quick Author.');
    });

    it('should handle file reading errors gracefully', async () => {
      // Arrange
      const readError = new Error('Permission denied');
      (fs.readFile as any).mockRejectedValue(readError);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error extracting PDF information:', readError);
      expect(result).toBe('Unable to extract PDF information. Please generate professional content based on LinkedIn best practices.');
    });

    it('should handle PDF loading errors gracefully', async () => {
      // Arrange
      const pdfError = new Error('Corrupted PDF file');
      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockRejectedValue(pdfError);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(console.error).toHaveBeenCalledWith('Error extracting PDF information:', pdfError);
      expect(result).toBe('Unable to extract PDF information. Please generate professional content based on LinkedIn best practices.');
    });

    it('should handle undefined/null metadata properties', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(3),
        getTitle: vi.fn().mockReturnValue(undefined),
        getAuthor: vi.fn().mockReturnValue(undefined),
        getSubject: vi.fn().mockReturnValue(null),
        getKeywords: vi.fn().mockReturnValue(null),
        getCreator: vi.fn().mockReturnValue(undefined)
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('Title: Untitled Document');
      expect(result).toContain('Author: Unknown Author');
      expect(result).toContain('Total Pages: 3');
      expect(result).toContain('This is a 3-page document.');
    });

    it('should format multi-page document description correctly', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(25),
        getTitle: vi.fn().mockReturnValue('Comprehensive Guide'),
        getAuthor: vi.fn().mockReturnValue('Expert Team'),
        getSubject: vi.fn().mockReturnValue('Best practices and methodologies'),
        getKeywords: vi.fn().mockReturnValue('guide, best practices, methodology'),
        getCreator: vi.fn().mockReturnValue('Adobe Acrobat Pro')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('This is a 25-page document titled "Comprehensive Guide" by Expert Team.');
      expect(result).toContain('The document covers: Best practices and methodologies');
      expect(result).toContain('Created using: Adobe Acrobat Pro');
    });

    it('should handle empty string metadata correctly', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(2),
        getTitle: vi.fn().mockReturnValue(''),
        getAuthor: vi.fn().mockReturnValue(''),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue(''),
        getCreator: vi.fn().mockReturnValue('')
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);

      // Act
      const result = await extractPDFInfo(mockFilePath);

      // Assert
      expect(result).toContain('Title: Untitled Document');
      expect(result).toContain('Author: Unknown Author');
      expect(result).toContain('This is a 2-page document.');
    });
  });
});