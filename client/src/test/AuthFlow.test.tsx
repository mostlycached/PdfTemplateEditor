import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider } from '../components/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

// Mock the query client
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock api calls
vi.mock('@lib/queryClient', () => ({
  apiRequest: vi.fn(),
  getQueryFn: vi.fn(),
  queryClient: createTestQueryClient(),
  throwIfResNotOk: vi.fn(),
}));

// Mock wouter navigation
vi.mock('wouter', async () => {
  const actual = await vi.importActual('wouter');
  return {
    ...actual,
    useLocation: () => ['/'],
    useRoute: () => [true],
  };
});

describe('Authentication Flow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    vi.clearAllMocks();
  });
  
  it('should show login button when user is not authenticated', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/sign in/i, { exact: false })).toBeInTheDocument();
    });
  });
  
  it('should display the login UI elements correctly', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </QueryClientProvider>
    );
    
    // Header should be visible
    expect(screen.getByRole('banner')).toBeInTheDocument();
    
    // Footer should be visible
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    
    // LinkedIn login button should be visible somewhere
    await waitFor(() => {
      const loginElements = screen.getAllByText(/sign in/i, { exact: false });
      expect(loginElements.length).toBeGreaterThan(0);
    });
  });
});