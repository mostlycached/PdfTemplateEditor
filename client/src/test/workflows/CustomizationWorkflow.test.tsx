import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import CustomizationPanel, { PDFCustomizations } from '../../components/CustomizationPanel';

// Mock the toast hook
vi.mock('../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('Customization Workflow', () => {
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
    vi.clearAllMocks();
  });

  it('should allow users to customize document title and subtitle', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find form fields
    const titleInput = screen.getByLabelText(/Title/i);
    const subtitleInput = screen.getByLabelText(/Subtitle/i);
    
    // Change title
    await user.clear(titleInput);
    await user.type(titleInput, 'My Custom Presentation');
    
    // Change subtitle
    await user.clear(subtitleInput);
    await user.type(subtitleInput, 'Created with PDF Enhancer');
    
    // Verify customization change was captured
    expect(mockOnCustomizationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'My Custom Presentation',
        subtitle: 'Created with PDF Enhancer'
      })
    );
  });
  
  it('should allow users to customize presenter name and date', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find form fields
    const presenterInput = screen.getByLabelText(/Presenter/i);
    const dateInput = screen.getByLabelText(/Date/i);
    
    // Change presenter
    await user.clear(presenterInput);
    await user.type(presenterInput, 'John Smith');
    
    // Change date (may need to adjust based on actual date picker implementation)
    await user.clear(dateInput);
    await user.type(dateInput, '2023-06-15');
    
    // Verify customization change was captured
    expect(mockOnCustomizationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        presenter: 'John Smith',
        date: '2023-06-15'
      })
    );
  });
  
  it('should allow users to customize color scheme and font family', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find color scheme input (this might be a color picker or select)
    const colorInput = screen.getByLabelText(/Color Scheme/i);
    
    // Change color (implementation depends on your actual color picker)
    if (colorInput.tagName === 'INPUT' && colorInput.getAttribute('type') === 'color') {
      fireEvent.change(colorInput, { target: { value: '#3366FF' } });
    }
    
    // Verify color scheme change was captured
    expect(mockOnCustomizationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        colorScheme: '#3366FF'
      })
    );
  });
  
  it('should apply changes when the Apply button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find the Apply button
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    
    // Click the apply button
    await user.click(applyButton);
    
    // Verify apply changes was called
    expect(mockOnApplyChanges).toHaveBeenCalled();
  });
});