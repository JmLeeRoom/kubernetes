import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  it('shows graph and runs when a DAG is selected', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DAGListPage />);
    await waitFor(() => {
      expect(screen.getByText('ml-training-pipeline')).toBeInTheDocument();
    });
    await user.click(screen.getByText('ml-training-pipeline'));
    await waitFor(() => {
      expect(screen.getByText(/Recent Runs/)).toBeInTheDocument();
    });
  });

  it('shows Trigger dialog when Trigger button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DAGListPage />);
    await waitFor(() => {
      expect(screen.getAllByText('Trigger').length).toBeGreaterThan(0);
    });
    await user.click(screen.getAllByText('Trigger')[0]);
    await waitFor(() => {
      expect(screen.getByText('Trigger DAG')).toBeInTheDocument();
    });
  });
});
