import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { VersionTable } from '../VersionTable';

const mockVersions = [
  { name: 'model-a', version: '1', current_stage: 'Production', status: 'READY', source: 'gs://bucket/model-a/v1' },
  { name: 'model-a', version: '2', current_stage: 'Staging', status: 'READY', source: 'gs://bucket/model-a/v2' },
  { name: 'model-a', version: '3', current_stage: 'None', status: 'PENDING', source: 'gs://bucket/model-a/v3' },
];

describe('VersionTable', () => {
  it('renders table headers', () => {
    renderWithProviders(<VersionTable versions={[]} onTransition={vi.fn()} />);
    expect(screen.getByText('Version')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    renderWithProviders(<VersionTable versions={[]} onTransition={vi.fn()} />);
    expect(screen.getByText('No versions found.')).toBeInTheDocument();
  });

  it('renders version data', () => {
    renderWithProviders(<VersionTable versions={mockVersions} onTransition={vi.fn()} />);
    expect(screen.getByText('v1')).toBeInTheDocument();
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('v3')).toBeInTheDocument();
    // Production appears both as badge and as dropdown option
    expect(screen.getAllByText('Production').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Staging').length).toBeGreaterThan(0);
  });

  it('calls onTransition when stage is changed', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn();
    renderWithProviders(<VersionTable versions={mockVersions} onTransition={onTransition} />);

    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'Staging');
    expect(onTransition).toHaveBeenCalledWith('model-a', '1', 'Staging');
  });

  it('filters out current stage from dropdown', () => {
    renderWithProviders(<VersionTable versions={[mockVersions[0]]} onTransition={vi.fn()} />);
    const select = screen.getByRole('combobox');
    const options = Array.from(select.querySelectorAll('option'));
    const optionValues = options.map((o) => o.value);
    expect(optionValues).not.toContain('Production');
    expect(optionValues).toContain('Staging');
    expect(optionValues).toContain('Archived');
  });
});
