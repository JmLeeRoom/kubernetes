import { describe, expect, it, beforeEach } from 'vitest';
import { screen, act } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Sidebar } from '../Sidebar';
import { useUIStore } from '@/stores/uiStore';

describe('Sidebar', () => {
  beforeEach(() => {
    act(() => {
      useUIStore.setState({ sidebarCollapsed: false });
    });
  });

  it('renders nav group labels when expanded', () => {
    renderWithProviders(<Sidebar />, { route: '/monitoring/cluster' });
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Serving')).toBeInTheDocument();
    expect(screen.getAllByText('MLOps').length).toBeGreaterThan(0);
  });

  it('hides labels when collapsed', () => {
    act(() => {
      useUIStore.setState({ sidebarCollapsed: true });
    });
    renderWithProviders(<Sidebar />, { route: '/monitoring/cluster' });
    expect(screen.queryByText('Cluster')).not.toBeInTheDocument();
    expect(screen.queryByText('Monitoring')).not.toBeInTheDocument();
  });

  it('renders all nav links', () => {
    renderWithProviders(<Sidebar />, { route: '/monitoring/cluster' });
    expect(screen.getByText('Cluster')).toBeInTheDocument();
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Connections')).toBeInTheDocument();
    expect(screen.getByText('Flows')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Experiments')).toBeInTheDocument();
  });
});
