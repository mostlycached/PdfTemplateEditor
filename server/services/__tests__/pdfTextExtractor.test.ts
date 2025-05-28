import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import { PDFDocument } from 'pdf-lib';
import { extractTextFromPDF, extractFirstPageText } from '../pdfTextExtractor';

// Mock dependencies
vi.mock('fs/promises');
vi.mock('pdf-lib');

// Mock pdf-parse
const mockPdfParse = vi.fn();
vi.mock('pdf-parse/lib/pdf-parse.js', () => mockPdfParse);

describe('PDF Text Extractor', () => {
  const mockFilePath = '/test/path/document.pdf';
  const mockPdfBuffer = Buffer.from('mock pdf content');
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.log and console.error for cleaner test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('extractTextFromPDF', () => {
    it('should extract text with metadata from a PDF file', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(5),
        getTitle: vi.fn().mockReturnValue('Sample Document'),
        getAuthor: vi.fn().mockReturnValue('John Doe'),
        getSubject: vi.fn().mockReturnValue('Technical Report'),
        getKeywords: vi.fn().mockReturnValue('technology, innovation')
      };

      const mockParsedData = {
        text: 'This is the extracted text content from the PDF document.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      const result = await extractTextFromPDF(mockFilePath, 3);

      // Assert
      expect(fs.readFile).toHaveBeenCalledWith(mockFilePath);
      expect(PDFDocument.load).toHaveBeenCalledWith(mockPdfBuffer);
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer, { max: 3 });
      
      expect(result).toContain('Title: Sample Document');
      expect(result).toContain('Author: John Doe');
      expect(result).toContain('Subject: Technical Report');
      expect(result).toContain('Keywords: technology, innovation');
      expect(result).toContain('--- Document Text (First 3 pages) ---');
      expect(result).toContain('This is the extracted text content from the PDF document.');
    });

    it('should handle PDF with minimal metadata', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(2),
        getTitle: vi.fn().mockReturnValue(null),
        getAuthor: vi.fn().mockReturnValue(null),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const mockParsedData = {
        text: 'Basic PDF content without metadata.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      const result = await extractTextFromPDF(mockFilePath, 3);

      // Assert
      expect(result).toContain('Title: Untitled Document');
      expect(result).toContain('Author: Unknown Author');
      expect(result).not.toContain('Subject:');
      expect(result).not.toContain('Keywords:');
      expect(result).toContain('--- Document Text (First 2 pages) ---');
      expect(result).toContain('Basic PDF content without metadata.');
    });

    it('should use default maxPages when not specified', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(10),
        getTitle: vi.fn().mockReturnValue('Test Document'),
        getAuthor: vi.fn().mockReturnValue('Test Author'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const mockParsedData = {
        text: 'Content from default page limit.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      const result = await extractTextFromPDF(mockFilePath);

      // Assert
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer, { max: 3 });
      expect(result).toContain('--- Document Text (First 3 pages) ---');
    });

    it('should handle file read errors', async () => {
      // Arrange
      const readError = new Error('File not found');
      (fs.readFile as any).mockRejectedValue(readError);

      // Act & Assert
      await expect(extractTextFromPDF(mockFilePath)).rejects.toThrow('File not found');
      expect(console.error).toHaveBeenCalledWith('Error extracting text from PDF:', readError);
    });

    it('should handle PDF loading errors', async () => {
      // Arrange
      const pdfError = new Error('Invalid PDF format');
      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockRejectedValue(pdfError);

      // Act & Assert
      await expect(extractTextFromPDF(mockFilePath)).rejects.toThrow('Invalid PDF format');
      expect(console.error).toHaveBeenCalledWith('Error extracting text from PDF:', pdfError);
    });

    it('should handle pdf-parse errors', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(5),
        getTitle: vi.fn().mockReturnValue('Test Document'),
        getAuthor: vi.fn().mockReturnValue('Test Author'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const parseError = new Error('Failed to parse PDF text');
      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockRejectedValue(parseError);

      // Act & Assert
      await expect(extractTextFromPDF(mockFilePath)).rejects.toThrow('Failed to parse PDF text');
      expect(console.error).toHaveBeenCalledWith('Error extracting text from PDF:', parseError);
    });

    it('should limit pages correctly when maxPages exceeds total pages', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(2),
        getTitle: vi.fn().mockReturnValue('Short Document'),
        getAuthor: vi.fn().mockReturnValue('Author'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const mockParsedData = {
        text: 'Content from all available pages.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      const result = await extractTextFromPDF(mockFilePath, 5);

      // Assert
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer, { max: 5 });
      expect(result).toContain('--- Document Text (First 2 pages) ---');
    });
  });

  describe('extractFirstPageText', () => {
    it('should extract text from first page only', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(10),
        getTitle: vi.fn().mockReturnValue('Multi-page Document'),
        getAuthor: vi.fn().mockReturnValue('Test Author'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const mockParsedData = {
        text: 'First page content only.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      const result = await extractFirstPageText(mockFilePath);

      // Assert
      expect(mockPdfParse).toHaveBeenCalledWith(mockPdfBuffer, { max: 1 });
      expect(result).toContain('--- Document Text (First 1 pages) ---');
      expect(result).toContain('First page content only.');
    });

    it('should handle errors in first page extraction', async () => {
      // Arrange
      const extractionError = new Error('First page extraction failed');
      (fs.readFile as any).mockRejectedValue(extractionError);

      // Act & Assert
      await expect(extractFirstPageText(mockFilePath)).rejects.toThrow('First page extraction failed');
      expect(console.error).toHaveBeenCalledWith('Error extracting first page text from PDF:', extractionError);
    });
  });

  describe('logging behavior', () => {
    it('should log extraction information', async () => {
      // Arrange
      const mockPdfDoc = {
        getPageCount: vi.fn().mockReturnValue(5),
        getTitle: vi.fn().mockReturnValue('Logged Document'),
        getAuthor: vi.fn().mockReturnValue('Logger'),
        getSubject: vi.fn().mockReturnValue(''),
        getKeywords: vi.fn().mockReturnValue('')
      };

      const mockParsedData = {
        text: 'Document content for logging test.'
      };

      (fs.readFile as any).mockResolvedValue(mockPdfBuffer);
      (PDFDocument.load as any).mockResolvedValue(mockPdfDoc);
      mockPdfParse.mockResolvedValue(mockParsedData);

      // Act
      await extractTextFromPDF(mockFilePath, 3);

      // Assert
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Extracting text from PDF "document.pdf" - 5 total pages')
      );
      expect(console.log).toHaveBeenCalledWith('Will extract up to 3 pages');
    });
  });
});