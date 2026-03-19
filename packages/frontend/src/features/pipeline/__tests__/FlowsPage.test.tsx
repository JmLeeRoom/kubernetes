import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import FlowsPage from '../pages/FlowsPage';

describe('FlowsPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<FlowsPage />);
    expect(screen.getByRole('heading', { name: 'Flows', level: 1 })).toBeInTheDocument();
  });

  it('renders flow list after data loads', async () => {
    renderWithProviders(<FlowsPage />);
    await waitFor(() => {
      const flows = screen.getAllByText(
        /etl-daily-sales|ml-feature-pipeline|data-quality-check|model-retraining|log-aggregation|report-generation/
      );
      expect(flows.length).toBeGreaterThan(0);
    });
  });

  it('renders flow runs section', async () => {
    renderWithProviders(<FlowsPage />);
    await waitFor(() => {
      expect(screen.getByText(/Flow Runs/)).toBeInTheDocument();
    });
  });

  it('shows flow run state badges', async () => {
    renderWithProviders(<FlowsPage />);
    await waitFor(() => {
      const states = screen.getAllByText(/COMPLETED|RUNNING|FAILED|CANCELLED/);
      expect(states.length).toBeGreaterThan(0);
    });
  });
});
