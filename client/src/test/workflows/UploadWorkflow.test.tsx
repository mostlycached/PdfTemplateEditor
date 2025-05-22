import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import UploadArea from '../../components/UploadArea';

// Mock the queryClient module
vi.mock('../../lib/queryClient', () => ({
  apiRequest: vi.fn(() => Promise.resolve({ 
    ok: true, 
    json: () => Promise.resolve({ id: 1, originalName: 'test.pdf', fileName: 'test-123.pdf' }) 
  })),
  getQueryFn: () => () => Promise.resolve([]),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  },
  throwIfResNotOk: vi.fn(),
}));

// Mock auth context
vi.mock('../../components/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: 1, username: 'testuser' },
    loading: false,
    login: vi.fn(),
    logout: vi.fn()
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

// Mock toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Upload Workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  });

  it('should display the upload area correctly', () => {
    renderWithProviders(<UploadArea />);
    
    expect(screen.getByText(/Upload your PDF/i, { exact: false })).toBeInTheDocument();
  });
  
  it('should handle file upload through drag and drop', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UploadArea />);
    
    // Create a file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const dataTransfer = {
      files: [file],
      types: ['Files'],
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file
        }
      ]
    };
    
    // Get the drop zone
    const dropzone = screen.getByText(/Upload your PDF/i, { exact: false }).closest('div');
    expect(dropzone).not.toBeNull();
    
    if (dropzone) {
      // Simulate drag and drop events
      fireEvent.dragEnter(dropzone, { dataTransfer });
      fireEvent.dragOver(dropzone, { dataTransfer });
      fireEvent.drop(dropzone, { dataTransfer });
      
      // Check if the file was uploaded
      await waitFor(() => {
        expect(screen.getByText(/Processing/i, { exact: false })).toBeInTheDocument();
      });
    }
  });
  
  it('should handle file upload through click and select', async () => {
    const user = userEvent.setup();
    renderWithProviders(<UploadArea />);
    
    // Create a file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Find the hidden file input (might need to adjust this selector)
    const fileInput = screen.getByLabelText(/Upload PDF/i, { exact: false }) || document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();
    
    if (fileInput) {
      // Upload the file
      await user.upload(fileInput, file);
      
      // Check if the file was uploaded
      await waitFor(() => {
        expect(screen.getByText(/Processing/i, { exact: false })).toBeInTheDocument();
      });
    }
  });
});