import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../components/AuthContext';
import UploadArea from '../components/UploadArea';

// Create a test query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock the queryClient module
vi.mock('../lib/queryClient', () => ({
  apiRequest: vi.fn(() => Promise.resolve({ 
    ok: true, 
    json: () => Promise.resolve({ id: 1, originalName: 'test.pdf', fileName: 'test-123.pdf' }) 
  })),
  getQueryFn: vi.fn(),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  },
  throwIfResNotOk: vi.fn(),
}));

describe('Upload Flow', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
    
    // Mock window.URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'mock-url');
  });

  it('should display upload area correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UploadArea />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Check if the upload area is displayed
    expect(screen.getByText(/Drop your PDF/i, { exact: false })).toBeInTheDocument();
  });
  
  it('should handle file upload correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UploadArea />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Create a file
    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    
    // Get the file input
    const fileInput = screen.getByLabelText(/Upload PDF/i, { exact: false }) as HTMLInputElement;
    
    // Upload the file
    await user.upload(fileInput, file);
    
    // Check if the upload is in progress
    await waitFor(() => {
      expect(screen.getByText(/Uploading/i, { exact: false })).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});