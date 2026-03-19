import { screen } from '@testing-library/react';
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
});
