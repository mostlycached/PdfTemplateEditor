import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import TemplateSelection from '../../components/TemplateSelection';

// Mock the template data API response
vi.mock('../../lib/queryClient', () => ({
  apiRequest: vi.fn(),
  getQueryFn: () => () => Promise.resolve([
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
    },
    {
      id: 3,
      name: 'Modern',
      imagePath: '/templates/modern.png',
      category: 'Creative'
    }
  ]),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  },
  throwIfResNotOk: vi.fn(),
}));

describe('Template Selection Workflow', () => {
  const mockSelectTemplate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock image loading
    global.Image = class {
      onload: () => void = () => {};
      constructor() {
        setTimeout(() => this.onload(), 100);
      }
    } as any;
  });

  it('should render the template selection component with available templates', async () => {
    renderWithProviders(<TemplateSelection onSelectTemplate={mockSelectTemplate} />);
    
    // Check if template selection heading is displayed
    expect(screen.getByText(/Choose a template/i, { exact: false })).toBeInTheDocument();
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Corporate')).toBeInTheDocument();
      expect(screen.getByText('Academic')).toBeInTheDocument();
      expect(screen.getByText('Modern')).toBeInTheDocument();
    });
  });
  
  it('should filter templates by category when category filter is applied', async () => {
    renderWithProviders(<TemplateSelection onSelectTemplate={mockSelectTemplate} />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Corporate')).toBeInTheDocument();
    });
    
    // Find and click the Business category filter
    const businessFilter = screen.getByText('Business');
    await userEvent.click(businessFilter);
    
    // Check if only Business templates are displayed
    expect(screen.getByText('Corporate')).toBeInTheDocument();
    expect(screen.queryByText('Academic')).not.toBeInTheDocument();
  });
  
  it('should highlight the selected template', async () => {
    renderWithProviders(
      <TemplateSelection 
        onSelectTemplate={mockSelectTemplate} 
        selectedTemplateId={1}
      />
    );
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Corporate')).toBeInTheDocument();
    });
    
    // Find the selected template card
    const selectedTemplate = screen.getByText('Corporate').closest('.template-card');
    
    // Check if it has the selected class or some visual indicator
    expect(selectedTemplate).toHaveClass('selected');
  });
  
  it('should call onSelectTemplate when a template is clicked', async () => {
    renderWithProviders(<TemplateSelection onSelectTemplate={mockSelectTemplate} />);
    
    // Wait for templates to load
    await waitFor(() => {
      expect(screen.getByText('Corporate')).toBeInTheDocument();
    });
    
    // Find and click a template
    const corporateTemplate = screen.getByText('Corporate').closest('.template-card');
    if (corporateTemplate) {
      await userEvent.click(corporateTemplate);
    }
    
    // Check if onSelectTemplate was called with the correct template
    expect(mockSelectTemplate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        name: 'Corporate',
        category: 'Business'
      })
    );
  });
});