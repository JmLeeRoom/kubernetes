import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import ModelRegistryPage from '../pages/ModelRegistryPage';

describe('ModelRegistryPage', () => {
  it('renders heading', () => {
    renderWithProviders(<ModelRegistryPage />);
    expect(screen.getByText('Model Registry')).toBeInTheDocument();
  });

  it('renders model cards from API', async () => {
    renderWithProviders(<ModelRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('fraud-detector')).toBeInTheDocument();
    });
  });

  it('renders all models', async () => {
    renderWithProviders(<ModelRegistryPage />);
    await waitFor(() => {
      expect(screen.getByText('recommendation-engine')).toBeInTheDocument();
      expect(screen.getByText('churn-predictor')).toBeInTheDocument();
    });
  });
});
