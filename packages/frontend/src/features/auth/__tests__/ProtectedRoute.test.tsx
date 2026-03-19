import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '../ProtectedRoute';

function renderWithAuth() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <span>protected content</span>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<span>login page</span>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: false,
        user: null,
        accessToken: null,
        refreshToken: null,
      });
    });
  });

  it('redirects to /login when not authenticated', () => {
    renderWithAuth();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
    expect(screen.getByText('login page')).toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    act(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        user: { id: '1', email: 'test@test.com', name: 'Test', groups: ['admin'] },
        accessToken: 'fake',
        refreshToken: 'fake',
      });
    });

    renderWithAuth();
    expect(screen.getByText('protected content')).toBeInTheDocument();
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });
});
