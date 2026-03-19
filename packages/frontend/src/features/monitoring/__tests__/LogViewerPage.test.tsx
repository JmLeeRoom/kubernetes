import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import LogViewerPage from '../pages/LogViewerPage';

describe('LogViewerPage', () => {
  it('renders the heading "Log Viewer"', () => {
    renderWithProviders(<LogViewerPage />);
    expect(screen.getByRole('heading', { name: 'Log Viewer' })).toBeInTheDocument();
  });

  it('renders the LogQL input and Search button', () => {
    renderWithProviders(<LogViewerPage />);
    expect(screen.getByRole('textbox', { name: /LogQL Query/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('renders the limit selector', () => {
    renderWithProviders(<LogViewerPage />);
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('submits query on button click and shows logs', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogViewerPage />);

    const input = screen.getByRole('textbox', { name: /LogQL Query/i });
    await user.type(input, 'app_logs');
    await user.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      // MSW handler should return log data
      expect(screen.queryByText('No logs found')).not.toBeInTheDocument();
    });
  });

  it('submits query on Enter key', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LogViewerPage />);

    const input = screen.getByRole('textbox', { name: /LogQL Query/i });
    await user.type(input, 'test_query{Enter}');

    await waitFor(() => {
      expect(screen.queryByText('No logs found')).not.toBeInTheDocument();
    });
  });
});
