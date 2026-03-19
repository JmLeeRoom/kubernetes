import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ExperimentList } from '../ExperimentList';

const mockExperiments = [
  { experiment_id: 'exp-1', name: 'Fraud Detection', lifecycle_stage: 'active' },
  { experiment_id: 'exp-2', name: 'Churn Model', lifecycle_stage: 'deleted' },
];

describe('ExperimentList', () => {
  it('renders experiment names', () => {
    renderWithProviders(
      <ExperimentList experiments={mockExperiments} selectedId={undefined} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Fraud Detection')).toBeInTheDocument();
    expect(screen.getByText('Churn Model')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderWithProviders(
      <ExperimentList experiments={[]} selectedId={undefined} onSelect={vi.fn()} />
    );
    expect(screen.getByText('No experiments found.')).toBeInTheDocument();
  });

  it('shows lifecycle stage', () => {
    renderWithProviders(
      <ExperimentList experiments={mockExperiments} selectedId={undefined} onSelect={vi.fn()} />
    );
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('deleted')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <ExperimentList experiments={mockExperiments} selectedId={undefined} onSelect={onSelect} />
    );
    await user.click(screen.getByText('Fraud Detection'));
    expect(onSelect).toHaveBeenCalledWith('exp-1');
  });
});
