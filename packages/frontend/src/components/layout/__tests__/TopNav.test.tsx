import { describe, expect, it, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { TopNav } from '../TopNav';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

describe('TopNav', () => {
  beforeEach(() => {
    act(() => {
      useAuthStore.setState({
        user: { id: '1', email: 'admin@test.com', name: 'Admin', groups: ['admin'] },
        accessToken: 'tok',
        refreshToken: 'ref',
        isAuthenticated: true,
      });
      useUIStore.setState({ theme: 'light', sidebarCollapsed: false });
    });
  });

  it('renders platform title', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByText('MLOps Platform')).toBeInTheDocument();
  });

  it('renders sidebar toggle button', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByRole('button', { name: 'Toggle sidebar' })).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByRole('button', { name: 'Toggle theme' })).toBeInTheDocument();
  });

  it('displays user email', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  });

  it('renders logout button when user exists', () => {
    renderWithProviders(<TopNav />);
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('hides user section when not logged in', () => {
    act(() => {
      useAuthStore.setState({ user: null, isAuthenticated: false });
    });
    renderWithProviders(<TopNav />);
    expect(screen.queryByText('admin@test.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Logout' })).not.toBeInTheDocument();
  });

  it('toggles theme on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TopNav />);
    await user.click(screen.getByRole('button', { name: 'Toggle theme' }));
    expect(useUIStore.getState().theme).toBe('dark');
  });
});
