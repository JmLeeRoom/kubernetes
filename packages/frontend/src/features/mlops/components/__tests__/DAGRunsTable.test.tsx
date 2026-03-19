import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { DAGRunsTable } from '../DAGRunsTable';

describe('DAGRunsTable', () => {
  it('renders table headers', () => {
    renderWithProviders(<DAGRunsTable runs={[]} />);
    expect(screen.getByText('Run ID')).toBeInTheDocument();
    expect(screen.getByText('State')).toBeInTheDocument();
    expect(screen.getByText('Execution Date')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderWithProviders(<DAGRunsTable runs={[]} />);
    expect(screen.getByText('No runs found.')).toBeInTheDocument();
  });

  it('renders runs with state badges', () => {
    const runs = [
      { dag_run_id: 'run-1', state: 'success', execution_date: '2024-01-15T10:00:00Z' },
      { dag_run_id: 'run-2', state: 'failed', execution_date: '2024-01-15T11:00:00Z' },
      { dag_run_id: 'run-3', state: 'running', execution_date: null },
    ];

    renderWithProviders(<DAGRunsTable runs={runs} />);
    expect(screen.getByText('run-1')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('shows dash for missing execution date', () => {
    const runs = [
      { dag_run_id: 'run-x', state: 'queued', execution_date: null },
    ];

    renderWithProviders(<DAGRunsTable runs={runs} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});
