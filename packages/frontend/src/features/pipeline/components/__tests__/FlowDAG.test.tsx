import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { FlowDAG } from '../FlowDAG';

// Mock reactflow since it requires browser APIs not available in jsdom
vi.mock('reactflow', () => {
  const ReactFlow = ({ nodes, edges, children }: { nodes: unknown[]; edges: unknown[]; children?: React.ReactNode }) => (
    <div data-testid="reactflow">
      <span data-testid="node-count">{nodes.length}</span>
      <span data-testid="edge-count">{edges.length}</span>
      {children}
    </div>
  );
  const Background = () => <div data-testid="rf-background" />;
  const Controls = () => <div data-testid="rf-controls" />;
  const MiniMap = () => <div data-testid="rf-minimap" />;

  return { default: ReactFlow, Background, Controls, MiniMap };
});

describe('FlowDAG', () => {
  it('renders empty state when no tasks provided', () => {
    renderWithProviders(<FlowDAG tasks={[]} />);
    expect(screen.getByText('No DAG structure available')).toBeInTheDocument();
  });

  it('renders ReactFlow with correct node count', () => {
    const tasks = [
      { task_id: 'extract', downstream_task_ids: ['transform'], state: 'success' as const },
      { task_id: 'transform', downstream_task_ids: ['load'], state: 'running' as const },
      { task_id: 'load', downstream_task_ids: [], state: 'queued' as const },
    ];

    renderWithProviders(<FlowDAG tasks={tasks} />);
    expect(screen.getByTestId('reactflow')).toBeInTheDocument();
    expect(screen.getByTestId('node-count')).toHaveTextContent('3');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('2');
  });

  it('renders nodes with no state', () => {
    const tasks = [
      { task_id: 'task-a', downstream_task_ids: [] },
    ];

    renderWithProviders(<FlowDAG tasks={tasks} />);
    expect(screen.getByTestId('node-count')).toHaveTextContent('1');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('0');
  });

  it('renders nodes with failed state', () => {
    const tasks = [
      { task_id: 'step1', downstream_task_ids: ['step2'], state: 'failed' as const },
      { task_id: 'step2', downstream_task_ids: [], state: 'none' as const },
    ];

    renderWithProviders(<FlowDAG tasks={tasks} />);
    expect(screen.getByTestId('node-count')).toHaveTextContent('2');
    expect(screen.getByTestId('edge-count')).toHaveTextContent('1');
  });

  it('renders background, controls and minimap', () => {
    const tasks = [
      { task_id: 'task-a', downstream_task_ids: [], state: 'success' as const },
    ];

    renderWithProviders(<FlowDAG tasks={tasks} />);
    expect(screen.getByTestId('rf-background')).toBeInTheDocument();
    expect(screen.getByTestId('rf-controls')).toBeInTheDocument();
    expect(screen.getByTestId('rf-minimap')).toBeInTheDocument();
  });
});
