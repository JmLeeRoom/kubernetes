import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import DAGListPage from '../pages/DAGListPage';

describe('DAGListPage', () => {
  it('renders heading', () => {
    renderWithProviders(<DAGListPage />);
    expect(screen.getByText('DAG Pipelines')).toBeInTheDocument();
  });

  it('renders DAG cards from API', async () => {
    renderWithProviders(<DAGListPage />);
    await waitFor(() => {
      expect(screen.getByText('ml-training-pipeline')).toBeInTheDocument();
    });
  });

  it('shows all DAGs', async () => {
    renderWithProviders(<DAGListPage />);
    await waitFor(() => {
      expect(screen.getByText('data-preprocessing')).toBeInTheDocument();
      expect(screen.getByText('batch-prediction')).toBeInTheDocument();
    });
  });
});
