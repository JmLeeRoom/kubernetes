import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { DAGGraphView } from '../DAGGraphView';

describe('DAGGraphView', () => {
  it('renders empty state when no tasks', () => {
    renderWithProviders(<DAGGraphView dagId="test-dag" tasks={[]} />);
    expect(screen.getByText('No tasks found.')).toBeInTheDocument();
  });

  it('renders dag title', () => {
    renderWithProviders(<DAGGraphView dagId="etl-pipeline" tasks={[]} />);
    expect(screen.getByText('etl-pipeline Graph')).toBeInTheDocument();
  });

  it('renders tasks in levels', () => {
    const tasks = [
      { task_id: 'extract', downstream_task_ids: ['transform'], task_type: 'PythonOperator' },
      { task_id: 'transform', downstream_task_ids: ['load'], task_type: 'PythonOperator' },
      { task_id: 'load', downstream_task_ids: [], task_type: 'PythonOperator' },
    ];

    renderWithProviders(<DAGGraphView dagId="etl" tasks={tasks} />);
    expect(screen.getByText('extract')).toBeInTheDocument();
    expect(screen.getByText('transform')).toBeInTheDocument();
    expect(screen.getByText('load')).toBeInTheDocument();
  });

  it('shows task type when provided', () => {
    const tasks = [
      { task_id: 'branch', downstream_task_ids: [], task_type: 'BranchOperator' },
    ];

    renderWithProviders(<DAGGraphView dagId="dag" tasks={tasks} />);
    expect(screen.getByText('BranchOperator')).toBeInTheDocument();
  });

  it('renders arrow between levels', () => {
    const tasks = [
      { task_id: 'a', downstream_task_ids: ['b'] },
      { task_id: 'b', downstream_task_ids: [] },
    ];

    renderWithProviders(<DAGGraphView dagId="dag" tasks={tasks} />);
    expect(screen.getByText('→')).toBeInTheDocument();
  });
});
