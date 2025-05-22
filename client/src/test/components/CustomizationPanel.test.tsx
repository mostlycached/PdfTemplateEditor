import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CustomizationPanel, { PDFCustomizations } from '../../components/CustomizationPanel';
import { renderWithProviders } from '../utils/test-utils';

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
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Check for form elements using their heading and form presence
    expect(screen.getByRole('heading', { name: /Customize Cover Page/i })).toBeInTheDocument();
    // Check that we have a form with customization inputs
    expect(document.getElementById('title')).toBeInTheDocument();
    expect(document.getElementById('subtitle')).toBeInTheDocument();
  });
  
  it('calls onCustomizationChange when form values change', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Get form fields by their id
    const titleInput = document.getElementById('title') as HTMLInputElement;
    
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
    
    renderWithProviders(
      <CustomizationPanel 
        templateId={1} 
        onCustomizationChange={mockOnCustomizationChange} 
        onApplyChanges={mockOnApplyChanges} 
        initialCustomizations={defaultCustomizations}
      />
    );
    
    // Find the Apply button by its text content
    const applyButton = screen.getByText(/Apply/i, { selector: 'button' });
    
    // Click the button
    await user.click(applyButton);
    
    // Check if onApplyChanges was called
    expect(mockOnApplyChanges).toHaveBeenCalled();
  });
});