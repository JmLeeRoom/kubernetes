import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SyncHistoryTable } from '../SyncHistoryTable';

describe('SyncHistoryTable', () => {
  it('renders loading skeleton', () => {
    const { container } = renderWithProviders(
      <SyncHistoryTable jobs={[]} isLoading={true} />
    );
    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBe(3);
  });

  it('renders empty state when no jobs', () => {
    renderWithProviders(<SyncHistoryTable jobs={[]} isLoading={false} />);
    expect(screen.getByText('No sync history.')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    const jobs = [
      {
        id: 1,
        configId: 'conn-1',
        status: 'succeeded',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        attempts: [{ id: 1, status: 'succeeded', bytesSynced: 5242880, recordsSynced: 1000 }],
      },
    ];

    renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    expect(screen.getByText('Job ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Records')).toBeInTheDocument();
    expect(screen.getByText('Bytes')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders job data correctly', () => {
    const jobs = [
      {
        id: 42,
        configId: 'conn-1',
        status: 'succeeded',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        attempts: [{ id: 1, status: 'succeeded', bytesSynced: 5242880, recordsSynced: 1500 }],
      },
    ];

    renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('succeeded')).toBeInTheDocument();
    expect(screen.getByText('1,500')).toBeInTheDocument();
    expect(screen.getByText('5.0 MB')).toBeInTheDocument();
  });

  it('renders dash for missing attempt data', () => {
    const jobs = [
      {
        id: 1,
        configId: 'conn-1',
        status: 'running',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:05:00Z',
        attempts: [],
      },
    ];

    renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it('renders dash when createdAt is missing', () => {
    const jobs = [
      {
        id: 1,
        configId: 'conn-1',
        status: 'pending',
        attempts: [{ id: 1, status: 'pending', bytesSynced: 0, recordsSynced: 0 }],
      },
    ];

    renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('applies correct status colors', () => {
    const jobs = [
      {
        id: 1, configId: 'c', status: 'succeeded', createdAt: '2024-01-01',
        attempts: [{ id: 1, status: 'succeeded', bytesSynced: 0, recordsSynced: 0 }],
      },
      {
        id: 2, configId: 'c', status: 'failed', createdAt: '2024-01-01',
        attempts: [{ id: 1, status: 'failed', bytesSynced: 0, recordsSynced: 0 }],
      },
      {
        id: 3, configId: 'c', status: 'running', createdAt: '2024-01-01',
        attempts: [{ id: 1, status: 'running', bytesSynced: 0, recordsSynced: 0 }],
      },
    ];

    const { container } = renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    expect(container.querySelector('.text-green-600')).toBeInTheDocument();
    expect(container.querySelector('.text-red-600')).toBeInTheDocument();
    expect(container.querySelector('.text-blue-600')).toBeInTheDocument();
  });

  it('renders multiple jobs', () => {
    const jobs = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      configId: 'conn-1',
      status: 'succeeded',
      createdAt: '2024-01-15T10:00:00Z',
      attempts: [{ id: 1, status: 'succeeded', bytesSynced: 1048576, recordsSynced: 100 }],
    }));

    renderWithProviders(<SyncHistoryTable jobs={jobs} />);
    const rows = screen.getAllByText('succeeded');
    expect(rows).toHaveLength(5);
  });
});
