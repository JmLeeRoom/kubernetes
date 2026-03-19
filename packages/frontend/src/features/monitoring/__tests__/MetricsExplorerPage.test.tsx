import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { renderWithProviders } from '@/test/utils';
import { server } from '@/mocks/server';
import MetricsExplorerPage from '../pages/MetricsExplorerPage';

describe('MetricsExplorerPage', () => {
  it('renders the heading "Metrics Explorer"', () => {
    renderWithProviders(<MetricsExplorerPage />);
    expect(screen.getByRole('heading', { name: 'Metrics Explorer' })).toBeInTheDocument();
  });

  it('renders the PromQL input and Run button', () => {
    renderWithProviders(<MetricsExplorerPage />);
    expect(screen.getByRole('textbox', { name: /PromQL Query/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Run' })).toBeInTheDocument();
  });

  it('shows error state on API failure', async () => {
    server.use(
      http.get('/api/v1/metrics/query_range', () =>
        HttpResponse.json({ error: 'Service Unavailable' }, { status: 503 })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<MetricsExplorerPage />);

    const input = screen.getByRole('textbox', { name: /PromQL Query/i });
    await user.type(input, 'rate(http_requests_total[5m])');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => {
      expect(screen.getByText(/Request failed with status code 503|Service Unavailable/i)).toBeInTheDocument();
    });
  });
});
