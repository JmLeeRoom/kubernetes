import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MetricsPreview } from '../MetricsPreview';

// Mock the useServiceMetrics hook
const mockUseServiceMetrics = vi.fn();
vi.mock('../../api', () => ({
  useServiceMetrics: (...args: unknown[]) => mockUseServiceMetrics(...args),
}));

describe('MetricsPreview', () => {
  it('shows placeholder when no name provided', () => {
    mockUseServiceMetrics.mockReturnValue({ data: undefined, isLoading: false });
    renderWithProviders(<MetricsPreview name={undefined} />);
    expect(screen.getByText('Select a model to view metrics.')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading', () => {
    mockUseServiceMetrics.mockReturnValue({ data: undefined, isLoading: true });
    const { container } = renderWithProviders(<MetricsPreview name="test-model" />);
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(2);
  });

  it('renders metrics data correctly', () => {
    mockUseServiceMetrics.mockReturnValue({
      data: {
        name: 'test-model',
        metrics: { rps: 123.456, latency_p99_ms: 42 },
      },
      isLoading: false,
    });

    renderWithProviders(<MetricsPreview name="test-model" />);
    expect(screen.getByText('Requests/sec')).toBeInTheDocument();
    expect(screen.getByText('123.5')).toBeInTheDocument();
    expect(screen.getByText('Latency P99')).toBeInTheDocument();
    expect(screen.getByText('42 ms')).toBeInTheDocument();
  });

  it('renders zero values when data has no metrics', () => {
    mockUseServiceMetrics.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    renderWithProviders(<MetricsPreview name="test-model" />);
    expect(screen.getByText('0.0')).toBeInTheDocument();
    expect(screen.getByText('0 ms')).toBeInTheDocument();
  });
});
