import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ModelCard } from '../ModelCard';

describe('ModelCard', () => {
  const mockModel = {
    name: 'fraud-detector',
    description: 'Fraud detection model',
    latest_versions: [
      { name: 'fraud-detector', version: '3', current_stage: 'Production', status: 'READY', source: 'gs://bucket/v3' },
    ],
  };

  it('renders model name', () => {
    renderWithProviders(
      <ModelCard model={mockModel} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.getByText('fraud-detector')).toBeInTheDocument();
  });

  it('renders description', () => {
    renderWithProviders(
      <ModelCard model={mockModel} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Fraud detection model')).toBeInTheDocument();
  });

  it('shows version count', () => {
    renderWithProviders(
      <ModelCard model={mockModel} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.getByText('1 version')).toBeInTheDocument();
  });

  it('shows latest version stage badge', () => {
    renderWithProviders(
      <ModelCard model={mockModel} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    renderWithProviders(
      <ModelCard model={mockModel} isSelected={false} onSelect={onSelect} />
    );
    await user.click(screen.getByText('fraud-detector'));
    expect(onSelect).toHaveBeenCalledWith('fraud-detector');
  });

  it('hides description when not provided', () => {
    renderWithProviders(
      <ModelCard model={{ ...mockModel, description: '' }} isSelected={false} onSelect={vi.fn()} />
    );
    expect(screen.queryByText('Fraud detection model')).not.toBeInTheDocument();
  });
});
