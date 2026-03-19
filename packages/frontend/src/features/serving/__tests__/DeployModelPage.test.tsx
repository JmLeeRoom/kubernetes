import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import DeployModelPage from '../pages/DeployModelPage';

describe('DeployModelPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<DeployModelPage />);
    expect(
      screen.getByRole('heading', { name: 'Deploy Model', level: 1 })
    ).toBeInTheDocument();
  });

  it('renders form fields', () => {
    renderWithProviders(<DeployModelPage />);
    expect(screen.getByLabelText(/Service Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Framework/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Model URI/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Min Replicas/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Max Replicas/)).toBeInTheDocument();
  });

  it('has a deploy button', () => {
    renderWithProviders(<DeployModelPage />);
    expect(screen.getByRole('button', { name: 'Deploy Model' })).toBeInTheDocument();
  });
});
