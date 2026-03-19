import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { TriggerDAGDialog } from '../TriggerDAGDialog';

describe('TriggerDAGDialog', () => {
  it('returns null when not open', () => {
    const { container } = renderWithProviders(
      <TriggerDAGDialog dagId="dag-1" open={false} onClose={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders dialog when open', () => {
    renderWithProviders(
      <TriggerDAGDialog dagId="my-dag" open={true} onClose={vi.fn()} onTrigger={vi.fn()} />
    );
    expect(screen.getByText('Trigger DAG')).toBeInTheDocument();
    expect(screen.getByText('my-dag')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithProviders(
      <TriggerDAGDialog dagId="dag" open={true} onClose={onClose} onTrigger={vi.fn()} />
    );

    await user.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onTrigger with parsed JSON on Trigger click', async () => {
    const user = userEvent.setup();
    const onTrigger = vi.fn();
    const onClose = vi.fn();
    renderWithProviders(
      <TriggerDAGDialog dagId="dag-1" open={true} onClose={onClose} onTrigger={onTrigger} />
    );

    await user.click(screen.getByText('Trigger'));
    expect(onTrigger).toHaveBeenCalledWith('dag-1', {});
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error on invalid JSON', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <TriggerDAGDialog dagId="dag" open={true} onClose={vi.fn()} onTrigger={vi.fn()} />
    );

    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'not json');
    await user.click(screen.getByText('Trigger'));
    expect(screen.getByText('Invalid JSON')).toBeInTheDocument();
  });
});
