import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { DeployToServingButton } from '../DeployToServingButton';

describe('DeployToServingButton', () => {
  const mockVersion = {
    name: 'fraud-model',
    version: '3',
    current_stage: 'Production',
    status: 'READY',
    source: 'gs://bucket/fraud-model/v3',
  };

  it('renders the button text', () => {
    renderWithProviders(<DeployToServingButton version={mockVersion} />);
    expect(screen.getByText('Deploy to Serving')).toBeInTheDocument();
  });

  it('is a clickable button', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DeployToServingButton version={mockVersion} />);
    const button = screen.getByText('Deploy to Serving');
    // Should not throw
    await user.click(button);
  });
});
