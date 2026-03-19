import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { TimeSeriesChart } from '../TimeSeriesChart';

// Mock recharts to avoid canvas/SVG rendering issues in jsdom
vi.mock('recharts', () => {
  const ResponsiveContainer = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  );
  const LineChart = ({ data, children }: { data: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="line-chart">
      <span data-testid="data-points">{data.length}</span>
      {children}
    </div>
  );
  const Line = ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`line-${dataKey}`} />
  );
  const CartesianGrid = () => <div data-testid="grid" />;
  const XAxis = () => <div data-testid="x-axis" />;
  const YAxis = () => <div data-testid="y-axis" />;
  const Tooltip = () => <div data-testid="tooltip" />;
  const Legend = () => <div data-testid="legend" />;

  return { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend };
});

describe('TimeSeriesChart', () => {
  it('renders empty state when series is empty', () => {
    renderWithProviders(<TimeSeriesChart series={[]} />);
    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  it('renders empty state with custom height', () => {
    const { container } = renderWithProviders(<TimeSeriesChart series={[]} height={500} />);
    const emptyDiv = container.querySelector('[style*="height"]');
    expect(emptyDiv).toHaveStyle({ height: '500px' });
  });

  it('renders chart with single series', () => {
    const series = [
      {
        metric: { __name__: 'cpu_usage' },
        values: [
          [1700000000, '0.5'],
          [1700000030, '0.7'],
          [1700000060, '0.3'],
        ] as [number, string][],
      },
    ];

    renderWithProviders(<TimeSeriesChart series={series} />);
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('data-points')).toHaveTextContent('3');
    expect(screen.getByTestId('line-cpu_usage')).toBeInTheDocument();
  });

  it('renders chart with multiple series', () => {
    const series = [
      {
        metric: { __name__: 'cpu_usage' },
        values: [[1700000000, '0.5']] as [number, string][],
      },
      {
        metric: { __name__: 'memory_usage' },
        values: [[1700000000, '0.8']] as [number, string][],
      },
    ];

    renderWithProviders(<TimeSeriesChart series={series} />);
    expect(screen.getByTestId('line-cpu_usage')).toBeInTheDocument();
    expect(screen.getByTestId('line-memory_usage')).toBeInTheDocument();
  });

  it('uses fallback series name when __name__ is missing', () => {
    const series = [
      {
        metric: {} as Record<string, string>,
        values: [[1700000000, '0.5']] as [number, string][],
      },
    ];

    renderWithProviders(<TimeSeriesChart series={series} />);
    expect(screen.getByTestId('line-series-0')).toBeInTheDocument();
  });

  it('renders grid, axes, tooltip, and legend', () => {
    const series = [
      {
        metric: { __name__: 'test' },
        values: [[1700000000, '1']] as [number, string][],
      },
    ];

    renderWithProviders(<TimeSeriesChart series={series} />);
    expect(screen.getByTestId('grid')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });
});
