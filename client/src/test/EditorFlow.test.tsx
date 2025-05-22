import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../components/AuthContext';
import Editor from '../pages/Editor';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the document API responses
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn((url) => {
    if (url?.includes('/api/documents')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          id: 1,
          originalName: 'test.pdf',
          fileName: 'test-123.pdf',
          createdAt: '2023-05-22T12:00:00Z',
          isModified: false
        })
      });
    }
    if (url?.includes('/api/templates')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            name: 'Corporate',
            imagePath: '/templates/corporate.png',
            category: 'Business'
          },
          {
            id: 2,
            name: 'Academic',
            imagePath: '/templates/academic.png',
            category: 'Education'
          }
        ])
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  }),
  getQueryFn: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  },
  throwIfResNotOk: vi.fn(),
}));

// Mock wouter router
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/editor?documentId=1'],
    useRoute: () => [true, { documentId: '1' }]
  };
});

// Mock PDF preview component
vi.mock('../components/PDFPreview', () => ({
  default: vi.fn(() => <div data-testid="pdf-preview">PDF Preview Mock</div>)
}));

// Mock Template Selection component
vi.mock('../components/TemplateSelection', () => ({
  default: vi.fn(({ onSelectTemplate }) => (
    <div data-testid="template-selection">
      <button onClick={() => onSelectTemplate({
        id: 1,
        name: 'Corporate',
        imagePath: '/templates/corporate.png',
        category: 'Business'
      })}>
        Select Template
      </button>
    </div>
  ))
}));

// Mock Customization Panel
vi.mock('../components/CustomizationPanel', () => ({
  default: vi.fn(({ onCustomizationChange, onApplyChanges }) => (
    <div data-testid="customization-panel">
      <button onClick={() => onCustomizationChange({
        title: 'New Title',
        subtitle: 'New Subtitle',
        presenter: 'John Doe',
        date: '2023-05-22',
        colorScheme: '#3366FF',
        fontFamily: 'Arial',
        titleSize: 'large',
        titleAlignment: 'center',
        backgroundStyle: 'gradient',
        backgroundOpacity: 0.8
      })}>
        Update Customization
      </button>
      <button onClick={onApplyChanges}>Apply Changes</button>
    </div>
  ))
}));

describe('Editor Page Flow', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    
    // Mock global fetch for PDF URLs
    global.fetch = vi.fn(() => 
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(new Blob(['dummy pdf content'], { type: 'application/pdf' }))
      })
    ) as any;
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  it('should render editor page with all components', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Editor />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
      expect(screen.getByTestId('template-selection')).toBeInTheDocument();
      expect(screen.getByTestId('customization-panel')).toBeInTheDocument();
    });
  });
  
  it('should handle the template selection and customization flow', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Editor />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Wait for components to load
    await waitFor(() => {
      expect(screen.getByTestId('template-selection')).toBeInTheDocument();
    });
    
    // Select a template
    const selectTemplateButton = screen.getByText('Select Template');
    await user.click(selectTemplateButton);
    
    // Update customization
    const updateCustomizationButton = screen.getByText('Update Customization');
    await user.click(updateCustomizationButton);
    
    // Apply changes
    const applyChangesButton = screen.getByText('Apply Changes');
    await user.click(applyChangesButton);
    
    // Check if the PDF preview is displayed with the updated content
    expect(screen.getByTestId('pdf-preview')).toBeInTheDocument();
  });
});