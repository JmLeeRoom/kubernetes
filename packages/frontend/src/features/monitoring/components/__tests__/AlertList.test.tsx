import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { AlertList } from '../AlertList';

const mockAlerts = [
  { alertname: 'HighCPU', severity: 'critical', state: 'firing', labels: {}, value: '1' },
  { alertname: 'DiskFull', severity: 'warning', state: 'firing', labels: {}, value: '1' },
];

describe('AlertList', () => {
  it('renders loading skeleton', () => {
    const { container } = renderWithProviders(<AlertList alerts={[]} isLoading />);
    expect(container.querySelectorAll('.animate-pulse')).toHaveLength(3);
  });

  it('renders no active alerts state', () => {
    renderWithProviders(<AlertList alerts={[]} />);
    expect(screen.getByText('No active alerts')).toBeInTheDocument();
  });

  it('renders alert table with data', () => {
    renderWithProviders(<AlertList alerts={mockAlerts} />);
    expect(screen.getByText('HighCPU')).toBeInTheDocument();
    expect(screen.getByText('DiskFull')).toBeInTheDocument();
    expect(screen.getByText('critical')).toBeInTheDocument();
    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('calls onSilence when Silence button clicked', async () => {
    const user = userEvent.setup();
    const onSilence = vi.fn();
    renderWithProviders(<AlertList alerts={mockAlerts} onSilence={onSilence} />);

    const silenceButtons = screen.getAllByText('Silence');
    await user.click(silenceButtons[0]);
    expect(onSilence).toHaveBeenCalledWith('HighCPU');
  });
});
