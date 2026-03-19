import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import SparkJobsPage from '../pages/SparkJobsPage';

describe('SparkJobsPage', () => {
  it('renders the heading "Spark Jobs"', () => {
    renderWithProviders(<SparkJobsPage />);
    expect(screen.getByRole('heading', { name: 'Spark Jobs' })).toBeInTheDocument();
  });

  it('renders status filter buttons', () => {
    renderWithProviders(<SparkJobsPage />);
    expect(screen.getByRole('button', { name: 'ALL' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'RUNNING' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'SUCCEEDED' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'FAILED' })).toBeInTheDocument();
  });

  it('renders job data after loading', async () => {
    renderWithProviders(<SparkJobsPage />);

    await waitFor(() => {
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1);
    });
  });
});
