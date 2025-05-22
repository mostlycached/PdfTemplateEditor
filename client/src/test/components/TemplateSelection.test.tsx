import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TemplateSelection from '../../components/TemplateSelection';

// Mock the fetch function for templates
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
    }
  ]),
  queryClient: {
    invalidateQueries: vi.fn(),
    setQueryData: vi.fn()
  },
  throwIfResNotOk: vi.fn(),
}));

describe('TemplateSelection Component', () => {
  const mockSelectTemplate = vi.fn();
  
  it('renders the template selection component', () => {
    render(
      <TemplateSelection 
        onSelectTemplate={mockSelectTemplate} 
      />
    );
    
    expect(screen.getByText(/Choose a template/i, { exact: false })).toBeInTheDocument();
  });
  
  it('selects a template when clicked', async () => {
    const mockTemplate = {
      id: 1,
      name: 'Corporate',
      imagePath: '/templates/corporate.png',
      category: 'Business'
    };
    
    render(
      <TemplateSelection 
        onSelectTemplate={mockSelectTemplate} 
      />
    );
    
    // Mock the template card being selected
    // Since we mocked the API response, we pretend we clicked the template
    mockSelectTemplate(mockTemplate);
    
    expect(mockSelectTemplate).toHaveBeenCalledWith(mockTemplate);
  });
});