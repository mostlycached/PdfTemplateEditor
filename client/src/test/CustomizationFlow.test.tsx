import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../components/AuthContext';
import CustomizationPanel, { PDFCustomizations } from '../components/CustomizationPanel';

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
    json: () => Promise.resolve({ id: 1, customizations: JSON.stringify({
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
    })}) 
  })),
  getQueryFn: vi.fn(),
  queryClient: createTestQueryClient(),
  throwIfResNotOk: vi.fn(),
}));

describe('Customization Flow', () => {
  let queryClient: QueryClient;
  const mockOnCustomizationChange = vi.fn();
  const mockOnApplyChanges = vi.fn();
  
  const defaultCustomizations: PDFCustomizations = {
    title: 'Default Title',
    subtitle: 'Default Subtitle',
    presenter: 'Presenter Name',
    date: '2023-05-01',
    colorScheme: '#000000',
    fontFamily: 'Arial',
    titleSize: 'medium',
    titleAlignment: 'center',
    backgroundStyle: 'solid',
    backgroundOpacity: 0.5
  };
  
  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });

  it('should render customization panel with default values', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomizationPanel 
            templateId={1} 
            onCustomizationChange={mockOnCustomizationChange} 
            onApplyChanges={mockOnApplyChanges} 
            initialCustomizations={defaultCustomizations}
          />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Check if the customization panel is displayed
    expect(screen.getByText(/Customize/i, { exact: false })).toBeInTheDocument();
    
    // Check if the form elements are displayed
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subtitle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Presenter/i)).toBeInTheDocument();
  });
  
  it('should update customization when user inputs are changed', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomizationPanel 
            templateId={1} 
            onCustomizationChange={mockOnCustomizationChange} 
            onApplyChanges={mockOnApplyChanges} 
            initialCustomizations={defaultCustomizations}
          />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Get form fields
    const titleInput = screen.getByLabelText(/Title/i);
    const subtitleInput = screen.getByLabelText(/Subtitle/i);
    
    // Change the title
    await user.clear(titleInput);
    await user.type(titleInput, 'New Document Title');
    
    // Change the subtitle
    await user.clear(subtitleInput);
    await user.type(subtitleInput, 'New Document Subtitle');
    
    // Check if the onChange handler was called with the updated values
    await waitFor(() => {
      expect(mockOnCustomizationChange).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Document Title',
        subtitle: 'New Document Subtitle'
      }));
    });
  });
  
  it('should call onApplyChanges when Apply button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CustomizationPanel 
            templateId={1} 
            onCustomizationChange={mockOnCustomizationChange} 
            onApplyChanges={mockOnApplyChanges} 
            initialCustomizations={defaultCustomizations}
          />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Find the Apply button
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    
    // Click the Apply button
    await user.click(applyButton);
    
    // Check if onApplyChanges was called
    expect(mockOnApplyChanges).toHaveBeenCalled();
  });
});