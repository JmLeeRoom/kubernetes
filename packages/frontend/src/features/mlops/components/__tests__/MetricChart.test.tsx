import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { MetricChart } from '../MetricChart';

describe('MetricChart', () => {
  it('returns null when values is empty', () => {
    const { container } = renderWithProviders(<MetricChart label="Loss" values={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders label', () => {
    renderWithProviders(<MetricChart label="Accuracy" values={[0.85, 0.90, 0.92]} />);
    expect(screen.getByText('Accuracy')).toBeInTheDocument();
  });

  it('renders min and max values', () => {
    renderWithProviders(<MetricChart label="Loss" values={[0.5, 0.3, 0.1]} />);
    expect(screen.getByText('0.100')).toBeInTheDocument();
    expect(screen.getByText('0.500')).toBeInTheDocument();
  });

  it('renders bars for each value', () => {
    const { container } = renderWithProviders(
      <MetricChart label="F1" values={[0.8, 0.85, 0.9]} />
    );
    const bars = container.querySelectorAll('[title]');
    expect(bars).toHaveLength(3);
  });

  it('handles single value (range=0)', () => {
    renderWithProviders(<MetricChart label="Single" values={[0.5]} />);
    // min and max are the same value, both show 0.500
    expect(screen.getAllByText('0.500').length).toBeGreaterThan(0);
  });
});
