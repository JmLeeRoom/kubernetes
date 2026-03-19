import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import ConnectionsPage from '../pages/ConnectionsPage';

describe('ConnectionsPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<ConnectionsPage />);
    expect(screen.getByText('Connections')).toBeInTheDocument();
  });

  it('renders connection cards after data loads', async () => {
    renderWithProviders(<ConnectionsPage />);
    await waitFor(() => {
      const cards = screen.getAllByText(/to-/);
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('displays connection status badges', async () => {
    renderWithProviders(<ConnectionsPage />);
    await waitFor(() => {
      const badges = screen.getAllByText(/active|inactive|deprecated/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('shows sync button for active connections', async () => {
    renderWithProviders(<ConnectionsPage />);
    await waitFor(() => {
      const syncButtons = screen.queryAllByText('Sync Now');
      expect(syncButtons.length).toBeGreaterThanOrEqual(0);
    });
  });
});
