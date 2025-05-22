import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import PDFPreview from '../../components/PDFPreview';

// Mock PDF rendering implementation
vi.mock('pdfjs-dist', () => ({
  getDocument: () => ({
    promise: Promise.resolve({
      numPages: 3,
      getPage: (pageNumber: number) => ({
        getViewport: () => ({ width: 800, height: 1000 }),
        render: vi.fn().mockResolvedValue(undefined),
      }),
    }),
  }),
  version: '2.0.0',
}));

describe('PDF Preview Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock canvas rendering
    const originalCreateElement = document.createElement;
    document.createElement = vi.fn((tagName) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => ({
            scale: vi.fn(),
            clearRect: vi.fn(),
            drawImage: vi.fn(),
          }),
          width: 800,
          height: 1000,
        };
      }
      return originalCreateElement.call(document, tagName);
    }) as any;
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-pdf-url');
  });

  it('should render the PDF preview component', async () => {
    renderWithProviders(
      <PDFPreview pdfUrl="test.pdf" />
    );
    
    // Check if the PDF preview component renders
    expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
  });
  
  it('should display side-by-side comparison when customized cover page is provided', async () => {
    renderWithProviders(
      <PDFPreview 
        pdfUrl="original.pdf" 
        customizedCoverPage="customized.pdf" 
        showSideBySide={true} 
      />
    );
    
    // Check if both previews are rendered in side-by-side mode
    await waitFor(() => {
      expect(screen.getByText(/Original/i)).toBeInTheDocument();
      expect(screen.getByText(/Customized/i)).toBeInTheDocument();
    });
  });
  
  it('should only show customized preview when showSideBySide is false', async () => {
    renderWithProviders(
      <PDFPreview 
        pdfUrl="original.pdf" 
        customizedCoverPage="customized.pdf" 
        showSideBySide={false} 
      />
    );
    
    // Check if only the customized preview is displayed
    await waitFor(() => {
      expect(screen.queryByText(/Original/i)).not.toBeInTheDocument();
      expect(screen.getByText(/Customized/i)).toBeInTheDocument();
    });
  });
});