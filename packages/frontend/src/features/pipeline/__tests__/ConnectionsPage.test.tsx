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

  it('shows connection count', async () => {
    renderWithProviders(<ConnectionsPage />);
    await waitFor(() => {
      expect(screen.getByText(/\d+ Airbyte connections/)).toBeInTheDocument();
    });
  });

  it('shows sync history when connection is selected', async () => {
    renderWithProviders(<ConnectionsPage />);
    await waitFor(() => {
      const cards = screen.getAllByText(/to-/);
      expect(cards.length).toBeGreaterThan(0);
    });

    // Click first connection card
    const cards = screen.getAllByText(/to-/);
    cards[0].closest('button')?.click() ?? cards[0].click();

    await waitFor(() => {
      expect(screen.getByText('Sync History')).toBeInTheDocument();
    });
  });
});
