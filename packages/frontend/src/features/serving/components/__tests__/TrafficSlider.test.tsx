import { describe, expect, it, vi } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { TrafficSlider } from '../TrafficSlider';

// Mock the useUpdateTraffic hook
const mockMutate = vi.fn();
vi.mock('../../api', () => ({
  useUpdateTraffic: () => ({
    mutate: mockMutate,
    isPending: false,
    isError: false,
  }),
}));

describe('TrafficSlider', () => {
  beforeEach(() => {
    mockMutate.mockClear();
  });

  it('renders default and canary percentages', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={20} />);
    expect(screen.getByText('Default: 80%')).toBeInTheDocument();
    expect(screen.getByText('Canary: 20%')).toBeInTheDocument();
  });

  it('renders the Apply Traffic Split button', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={20} />);
    expect(screen.getByText('Apply Traffic Split')).toBeInTheDocument();
  });

  it('disables apply button when value equals currentCanary', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={20} />);
    const button = screen.getByText('Apply Traffic Split');
    expect(button).toBeDisabled();
  });

  it('enables apply button when slider value changes', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={20} />);
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '50' } });

    expect(screen.getByText('Default: 50%')).toBeInTheDocument();
    expect(screen.getByText('Canary: 50%')).toBeInTheDocument();
    expect(screen.getByText('Apply Traffic Split')).not.toBeDisabled();
  });

  it('calls mutate with correct args when apply is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TrafficSlider name="my-model" currentCanary={10} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '30' } });

    await user.click(screen.getByText('Apply Traffic Split'));
    expect(mockMutate).toHaveBeenCalledWith({ name: 'my-model', canaryPercent: 30 });
  });

  it('shows Promote button when canary > 0', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={20} />);
    expect(screen.getByText('Promote (100% Default)')).toBeInTheDocument();
  });

  it('hides Promote button when canary is 0', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={0} />);
    expect(screen.queryByText('Promote (100% Default)')).not.toBeInTheDocument();
  });

  it('calls mutate with 0 when Promote is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TrafficSlider name="my-model" currentCanary={20} />);

    await user.click(screen.getByText('Promote (100% Default)'));
    expect(mockMutate).toHaveBeenCalledWith({ name: 'my-model', canaryPercent: 0 });
  });

  it('renders with 0% canary correctly', () => {
    renderWithProviders(<TrafficSlider name="test-model" currentCanary={0} />);
    expect(screen.getByText('Default: 100%')).toBeInTheDocument();
    expect(screen.getByText('Canary: 0%')).toBeInTheDocument();
  });
});
