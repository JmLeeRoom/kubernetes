import { screen } from '@testing-library/react';
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
});
