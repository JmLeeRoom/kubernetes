import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import ExperimentsPage from '../pages/ExperimentsPage';

describe('ExperimentsPage', () => {
  it('renders heading', async () => {
    renderWithProviders(<ExperimentsPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Experiments' })).toBeInTheDocument();
  });

  it('renders experiment list from API', async () => {
    renderWithProviders(<ExperimentsPage />);
    await waitFor(() => {
      expect(screen.getByText('fraud-detection-v3')).toBeInTheDocument();
    });
  });

  it('shows the runs heading', () => {
    renderWithProviders(<ExperimentsPage />);
    expect(screen.getByText('Runs')).toBeInTheDocument();
  });
});
