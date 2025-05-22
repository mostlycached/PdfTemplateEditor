import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomizationPanel, { PDFCustomizations } from '../../components/CustomizationPanel';

describe('CustomizationPanel Component', () => {
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
  
  it('renders the customization panel with default values', () => {
    render(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Check for form elements
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subtitle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Presenter/i)).toBeInTheDocument();
  });
  
  it('calls onCustomizationChange when form values change', async () => {
    const user = userEvent.setup();
    
    render(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Get form fields
    const titleInput = screen.getByLabelText(/Title/i);
    
    // Clear and type in the title field
    await user.clear(titleInput);
    await user.type(titleInput, 'New Custom Title');
    
    // Check if onCustomizationChange was called with the new value
    expect(mockOnCustomizationChange).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'New Custom Title',
      })
    );
  });
  
  it('calls onApplyChanges when Apply button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find the Apply button
    const applyButton = screen.getByRole('button', { name: /Apply/i });
    
    // Click the button
    await user.click(applyButton);
    
    // Check if onApplyChanges was called
    expect(mockOnApplyChanges).toHaveBeenCalled();
  });
});