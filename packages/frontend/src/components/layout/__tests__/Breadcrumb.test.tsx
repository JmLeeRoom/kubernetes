import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Breadcrumb } from '../Breadcrumb';

describe('Breadcrumb', () => {
  it('renders breadcrumb segments from path', () => {
    renderWithProviders(<Breadcrumb />, { route: '/monitoring/cluster' });
    expect(screen.getByText('Monitoring')).toBeInTheDocument();
    expect(screen.getByText('Cluster')).toBeInTheDocument();
  });

  it('makes last segment non-clickable', () => {
    renderWithProviders(<Breadcrumb />, { route: '/monitoring/cluster' });
    const clusterText = screen.getByText('Cluster');
    expect(clusterText.tagName).toBe('SPAN');
    expect(clusterText.closest('a')).toBeNull();
  });

  it('makes non-last segments as links', () => {
    renderWithProviders(<Breadcrumb />, { route: '/monitoring/cluster' });
    const monitoringLink = screen.getByText('Monitoring');
    expect(monitoringLink.closest('a')).toBeDefined();
  });

  it('returns null for root path', () => {
    const { container } = renderWithProviders(<Breadcrumb />, { route: '/' });
    expect(container.querySelector('nav')).toBeNull();
  });

  it('handles deep paths', () => {
    renderWithProviders(<Breadcrumb />, { route: '/serving/models/detail' });
    expect(screen.getByText('Serving')).toBeInTheDocument();
    expect(screen.getByText('Models')).toBeInTheDocument();
    expect(screen.getByText('Detail')).toBeInTheDocument();
  });
});
