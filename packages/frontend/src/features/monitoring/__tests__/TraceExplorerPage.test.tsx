import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import TraceExplorerPage from '../pages/TraceExplorerPage';

describe('TraceExplorerPage', () => {
  it('renders the heading "Trace Explorer"', () => {
    renderWithProviders(<TraceExplorerPage />);
    expect(screen.getByRole('heading', { name: 'Trace Explorer' })).toBeInTheDocument();
  });

  it('renders the search form with service, operation, and duration inputs', () => {
    renderWithProviders(<TraceExplorerPage />);
    expect(screen.getByRole('textbox', { name: /Service/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Operation/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Min Duration/i })).toBeInTheDocument();
  });

  it('renders Search Traces button', () => {
    renderWithProviders(<TraceExplorerPage />);
    expect(screen.getByRole('button', { name: 'Search Traces' })).toBeInTheDocument();
  });

  it('searches and displays traces when Search Traces is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TraceExplorerPage />);

    await user.type(screen.getByRole('textbox', { name: /Service/i }), 'api-gateway');
    await user.click(screen.getByRole('button', { name: 'Search Traces' }));

    await waitFor(() => {
      // MSW returns traces with service names
      expect(screen.getAllByText(/api-gateway|serving-svc/).length).toBeGreaterThan(0);
    });
  });

  it('shows "No traces found." initially when not searching', () => {
    renderWithProviders(<TraceExplorerPage />);
    expect(screen.getByText('No traces found.')).toBeInTheDocument();
  });
});
