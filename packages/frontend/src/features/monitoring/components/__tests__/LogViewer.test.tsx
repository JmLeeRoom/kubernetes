import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { LogViewer } from '../LogViewer';

// Mock @tanstack/react-virtual since it relies on scroll measurements
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 24,
    getVirtualItems: () =>
      Array.from({ length: count }, (_, i) => ({
        index: i,
        start: i * 24,
        size: 24,
        key: i,
      })),
    scrollToIndex: vi.fn(),
  }),
}));

describe('LogViewer', () => {
  it('renders loading state', () => {
    const { container } = renderWithProviders(
      <LogViewer data={undefined} isLoading={true} />
    );
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders empty state when no data', () => {
    renderWithProviders(<LogViewer data={undefined} isLoading={false} />);
    expect(screen.getByText('No logs found')).toBeInTheDocument();
  });

  it('renders empty state when data has empty result', () => {
    const data = { data: { resultType: 'streams', result: [] } };
    renderWithProviders(<LogViewer data={data} isLoading={false} />);
    expect(screen.getByText('No logs found')).toBeInTheDocument();
  });

  it('renders log lines from data', () => {
    const now = Date.now() * 1e6;
    const data = {
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { app: 'api-gateway' },
            values: [
              [String(now), 'INFO: Server started successfully'],
              [String(now + 1e6), 'ERROR: Connection refused to database'],
            ],
          },
        ],
      },
    };

    renderWithProviders(<LogViewer data={data} isLoading={false} />);
    expect(screen.getByText('INFO: Server started successfully')).toBeInTheDocument();
    expect(screen.getByText('ERROR: Connection refused to database')).toBeInTheDocument();
  });

  it('extracts log levels correctly', () => {
    const now = Date.now() * 1e6;
    const data = {
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { app: 'test' },
            values: [
              [String(now), 'ERROR: something broke'],
              [String(now + 1e6), 'warn: disk space low'],
              [String(now + 2e6), 'debug: verbose output'],
              [String(now + 3e6), 'normal log message'],
            ],
          },
        ],
      },
    };

    renderWithProviders(<LogViewer data={data} isLoading={false} />);

    const levels = screen.getAllByText(/^(error|warn|debug|info)$/i);
    expect(levels).toHaveLength(4);
  });

  it('applies correct color classes for log levels', () => {
    const now = Date.now() * 1e6;
    const data = {
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { app: 'test' },
            values: [
              [String(now), 'ERROR: critical failure'],
            ],
          },
        ],
      },
    };

    const { container } = renderWithProviders(<LogViewer data={data} isLoading={false} />);
    const errorLabel = container.querySelector('.text-red-500');
    expect(errorLabel).toBeInTheDocument();
  });
});
