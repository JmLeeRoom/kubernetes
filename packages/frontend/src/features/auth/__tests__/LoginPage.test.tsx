import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import LoginPage from '../LoginPage';

describe('LoginPage', () => {
  it('renders the login form with email and password fields', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('renders sign in button', () => {
    renderWithProviders(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the MLOps Platform heading', () => {
    renderWithProviders(<LoginPage />);
    expect(
      screen.getByRole('heading', { name: 'MLOps Platform' })
    ).toBeInTheDocument();
  });

  it('submits login form with credentials', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />, { route: '/login' });

    await user.type(screen.getByLabelText(/email/i), 'admin@company.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // MSW handler returns success - button should return to normal
    await waitFor(() => {
      expect(screen.queryByText('Signing in...')).not.toBeInTheDocument();
    });
  });

  it('updates input values on type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@test.com');
    expect(emailInput).toHaveValue('test@test.com');

    const passwordInput = screen.getByLabelText(/password/i);
    await user.type(passwordInput, 'secret');
    expect(passwordInput).toHaveValue('secret');
  });
});
