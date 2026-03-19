import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { RunTable } from '../RunTable';

const mockRuns = [
  {
    run_id: 'run-abcdef12-3456-7890',
    status: 'FINISHED',
    start_time: '2024-01-15T10:00:00Z',
    params: { lr: '0.01' },
    metrics: { accuracy: 0.92 },
  },
  {
    run_id: 'run-ghijkl34-5678-9012',
    status: 'RUNNING',
    start_time: '2024-01-15T11:00:00Z',
    params: { lr: '0.001' },
    metrics: { accuracy: 0.88 },
  },
];

describe('RunTable', () => {
  it('renders table headers', () => {
    renderWithProviders(
      <RunTable runs={mockRuns} selectedRunIds={new Set()} onToggleRun={vi.fn()} />
    );
    expect(screen.getByText('Run ID')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('lr')).toBeInTheDocument();
    expect(screen.getByText('accuracy')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderWithProviders(
      <RunTable runs={[]} selectedRunIds={new Set()} onToggleRun={vi.fn()} />
    );
    expect(screen.getByText(/No runs found/)).toBeInTheDocument();
  });

  it('renders run data', () => {
    renderWithProviders(
      <RunTable runs={mockRuns} selectedRunIds={new Set()} onToggleRun={vi.fn()} />
    );
    expect(screen.getByText('run-abcd')).toBeInTheDocument();
    expect(screen.getByText('FINISHED')).toBeInTheDocument();
    expect(screen.getByText('RUNNING')).toBeInTheDocument();
  });

  it('shows checkboxes and calls onToggleRun', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderWithProviders(
      <RunTable runs={mockRuns} selectedRunIds={new Set()} onToggleRun={onToggle} />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    await user.click(checkboxes[0]);
    expect(onToggle).toHaveBeenCalledWith('run-abcdef12-3456-7890');
  });

  it('checks checkbox for selected runs', () => {
    renderWithProviders(
      <RunTable
        runs={mockRuns}
        selectedRunIds={new Set(['run-abcdef12-3456-7890'])}
        onToggleRun={vi.fn()}
      />
    );
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });
});
