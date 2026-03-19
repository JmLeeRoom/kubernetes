import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import ClusterOverviewPage from '../pages/ClusterOverviewPage';

describe('ClusterOverviewPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<ClusterOverviewPage />);
    expect(screen.getByText('Cluster Overview')).toBeInTheDocument();
  });

  it('renders node cards after data loads', async () => {
    renderWithProviders(<ClusterOverviewPage />);
    await waitFor(() => {
      expect(screen.getByText('Nodes')).toBeInTheDocument();
    });
    await waitFor(() => {
      const nodeCards = screen.getAllByText(/Ready|NotReady/);
      expect(nodeCards.length).toBeGreaterThan(0);
    });
  });

  it('renders resource gauges', async () => {
    renderWithProviders(<ClusterOverviewPage />);
    await waitFor(() => {
      expect(screen.getByText('CPU')).toBeInTheDocument();
      expect(screen.getByText('Memory')).toBeInTheDocument();
    });
  });

  it('renders pod status summary', async () => {
    renderWithProviders(<ClusterOverviewPage />);
    await waitFor(() => {
      expect(screen.getByText('Pod Status')).toBeInTheDocument();
    });
  });
});
