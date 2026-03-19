import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './utils';
import { PageSkeleton } from '@/components/common/PageSkeleton';
import { StatusBadge } from '@/components/common/StatusBadge';
import { MetricCard } from '@/components/common/MetricCard';

describe('Smoke tests', () => {
  it('renders PageSkeleton', () => {
    renderWithProviders(<PageSkeleton />);
    expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0);
  });

  it('renders StatusBadge with correct label', () => {
    renderWithProviders(<StatusBadge status="healthy" label="Ready" />);
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('renders MetricCard with value', () => {
    renderWithProviders(<MetricCard title="CPU Usage" value="73" unit="%" />);
    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('73')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();
  });
});
