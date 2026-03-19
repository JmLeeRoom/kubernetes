import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { DAGCard } from '../DAGCard';

const mockDag = {
  dag_id: 'etl-pipeline',
  description: 'Daily ETL pipeline',
  is_active: true,
  is_paused: false,
  schedule_interval: '@daily',
  tags: [],
};

describe('DAGCard', () => {
  it('renders dag id and description', () => {
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('etl-pipeline')).toBeInTheDocument();
    expect(screen.getByText('Daily ETL pipeline')).toBeInTheDocument();
  });

  it('shows schedule interval', () => {
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('@daily')).toBeInTheDocument();
  });

  it('shows "No schedule" when no interval', () => {
    renderWithProviders(
      <DAGCard dag={{ ...mockDag, schedule_interval: null }} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('No schedule')).toBeInTheDocument();
  });

  it('shows Pause button when active', () => {
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('Pause')).toBeInTheDocument();
  });

  it('shows Resume button when paused', () => {
    renderWithProviders(
      <DAGCard dag={{ ...mockDag, is_paused: true }} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('Resume')).toBeInTheDocument();
  });

  it('calls onSelect on card click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={onSelect} onTogglePause={vi.fn()} onTrigger={vi.fn()} />
    );
    await user.click(screen.getByText('etl-pipeline'));
    expect(onSelect).toHaveBeenCalledWith('etl-pipeline');
  });

  it('calls onTogglePause on Pause click', async () => {
    const user = userEvent.setup();
    const onTogglePause = vi.fn();
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={vi.fn()} onTogglePause={onTogglePause} onTrigger={vi.fn()} />
    );
    await user.click(screen.getByText('Pause'));
    expect(onTogglePause).toHaveBeenCalledWith('etl-pipeline', true);
  });

  it('calls onTrigger on Trigger click', async () => {
    const user = userEvent.setup();
    const onTrigger = vi.fn();
    renderWithProviders(
      <DAGCard dag={mockDag} isSelected={false} onSelect={vi.fn()} onTogglePause={vi.fn()} onTrigger={onTrigger} />
    );
    await user.click(screen.getByText('Trigger'));
    expect(onTrigger).toHaveBeenCalledWith('etl-pipeline');
  });
});
