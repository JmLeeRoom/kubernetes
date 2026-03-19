import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import AlertsPage from '../pages/AlertsPage';

describe('AlertsPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<AlertsPage />);
    expect(screen.getByText('Alerts')).toBeInTheDocument();
  });

  it('renders alerts from MSW after loading', async () => {
    renderWithProviders(<AlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('HighCPUUsage')).toBeInTheDocument();
      expect(screen.getByText('PodCrashLooping')).toBeInTheDocument();
    });
  });

  it('displays severity badges', async () => {
    renderWithProviders(<AlertsPage />);
    await waitFor(() => {
      expect(screen.getByText('warning')).toBeInTheDocument();
      expect(screen.getByText('critical')).toBeInTheDocument();
    });
  });

  it('shows silence buttons', async () => {
    renderWithProviders(<AlertsPage />);
    await waitFor(() => {
      const silenceButtons = screen.getAllByText('Silence');
      expect(silenceButtons.length).toBe(2);
    });
  });
});
