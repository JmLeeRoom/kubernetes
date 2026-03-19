import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { TraceTimeline } from '../TraceTimeline';

const makeTrace = (overrides = {}) => ({
  traceID: 'abc123def456abc123def456abc12345',
  rootServiceName: 'api-gateway',
  rootTraceName: 'GET /health',
  durationMs: 150,
  startTimeUnixNano: Date.now() * 1e6,
  ...overrides,
});

describe('TraceTimeline', () => {
  it('renders loading skeleton', () => {
    const { container } = renderWithProviders(
      <TraceTimeline traces={[]} isLoading={true} />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(5);
  });

  it('renders empty state when no traces', () => {
    renderWithProviders(<TraceTimeline traces={[]} />);
    expect(screen.getByText('No traces found.')).toBeInTheDocument();
  });

  it('renders trace list with service name and operation', () => {
    const traces = [
      makeTrace({ traceID: 'trace-1', rootServiceName: 'api-gateway', rootTraceName: 'GET /health' }),
      makeTrace({ traceID: 'trace-2', rootServiceName: 'serving-svc', rootTraceName: 'POST /predict' }),
    ];

    renderWithProviders(<TraceTimeline traces={traces} />);
    expect(screen.getByText('api-gateway')).toBeInTheDocument();
    expect(screen.getByText('GET /health')).toBeInTheDocument();
    expect(screen.getByText('serving-svc')).toBeInTheDocument();
    expect(screen.getByText('POST /predict')).toBeInTheDocument();
  });

  it('displays truncated trace ID', () => {
    const traces = [makeTrace({ traceID: 'abcdef1234567890abcdef1234567890' })];
    renderWithProviders(<TraceTimeline traces={traces} />);
    expect(screen.getByText('abcdef1234567890...')).toBeInTheDocument();
  });

  it('displays duration in ms', () => {
    const traces = [makeTrace({ durationMs: 250.5 })];
    renderWithProviders(<TraceTimeline traces={traces} />);
    expect(screen.getByText('250.5 ms')).toBeInTheDocument();
  });

  it('calls onSelect when trace is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const traces = [makeTrace({ traceID: 'click-trace-id-1234567890123456' })];

    renderWithProviders(<TraceTimeline traces={traces} onSelect={onSelect} />);
    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('click-trace-id-1234567890123456');
  });

  it('applies red color for slow traces (>1000ms)', () => {
    const traces = [makeTrace({ durationMs: 1500 })];
    const { container } = renderWithProviders(<TraceTimeline traces={traces} />);
    const bar = container.querySelector('.bg-red-500');
    expect(bar).toBeInTheDocument();
  });

  it('applies yellow color for medium traces (>500ms)', () => {
    const traces = [makeTrace({ durationMs: 750 })];
    const { container } = renderWithProviders(<TraceTimeline traces={traces} />);
    const bar = container.querySelector('.bg-yellow-500');
    expect(bar).toBeInTheDocument();
  });

  it('applies blue color for fast traces (<500ms)', () => {
    const traces = [makeTrace({ durationMs: 100 })];
    const { container } = renderWithProviders(<TraceTimeline traces={traces} />);
    const bar = container.querySelector('.bg-blue-500');
    expect(bar).toBeInTheDocument();
  });
});
