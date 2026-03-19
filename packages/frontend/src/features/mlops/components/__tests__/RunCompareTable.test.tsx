import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { RunCompareTable } from '../RunCompareTable';

const mockRuns = [
  {
    run_id: 'run-abcd1234-5678',
    status: 'FINISHED',
    start_time: '2024-01-15T10:00:00Z',
    params: { lr: '0.01', batch_size: '32' },
    metrics: { accuracy: 0.92, f1: 0.88 },
  },
  {
    run_id: 'run-efgh5678-9012',
    status: 'FINISHED',
    start_time: '2024-01-15T11:00:00Z',
    params: { lr: '0.001', batch_size: '64' },
    metrics: { accuracy: 0.95, f1: 0.91 },
  },
];

describe('RunCompareTable', () => {
  it('returns null when no runs', () => {
    const { container } = renderWithProviders(<RunCompareTable runs={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders run IDs as column headers (truncated)', () => {
    renderWithProviders(<RunCompareTable runs={mockRuns} />);
    expect(screen.getByText('run-abcd')).toBeInTheDocument();
    expect(screen.getByText('run-efgh')).toBeInTheDocument();
  });

  it('renders status row', () => {
    renderWithProviders(<RunCompareTable runs={mockRuns} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getAllByText('FINISHED')).toHaveLength(2);
  });

  it('renders parameter section', () => {
    renderWithProviders(<RunCompareTable runs={mockRuns} />);
    expect(screen.getByText('Parameters')).toBeInTheDocument();
    expect(screen.getByText('lr')).toBeInTheDocument();
    expect(screen.getByText('batch_size')).toBeInTheDocument();
    expect(screen.getByText('0.01')).toBeInTheDocument();
    expect(screen.getByText('0.001')).toBeInTheDocument();
  });

  it('renders metrics section', () => {
    renderWithProviders(<RunCompareTable runs={mockRuns} />);
    expect(screen.getByText('Metrics')).toBeInTheDocument();
    expect(screen.getByText('accuracy')).toBeInTheDocument();
    expect(screen.getByText('f1')).toBeInTheDocument();
  });

  it('highlights best metric value', () => {
    const { container } = renderWithProviders(<RunCompareTable runs={mockRuns} />);
    const boldGreen = container.querySelectorAll('.font-bold.text-green-600');
    expect(boldGreen.length).toBeGreaterThan(0);
  });
});
