import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AppShell } from '../AppShell';

describe('AppShell', () => {
  it('renders sidebar, topnav, and breadcrumb', () => {
    renderWithProviders(<AppShell />, { route: '/monitoring/cluster' });
    expect(screen.getByText('MLOps Platform')).toBeInTheDocument();
    expect(screen.getAllByRole('navigation').length).toBeGreaterThan(0);
  });

  it('renders sidebar nav links', () => {
    renderWithProviders(<AppShell />, { route: '/monitoring/cluster' });
    expect(screen.getAllByText('Cluster').length).toBeGreaterThan(0);
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('Logs')).toBeInTheDocument();
  });
});
