import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
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
});
