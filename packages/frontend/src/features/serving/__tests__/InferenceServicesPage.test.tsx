import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import InferenceServicesPage from '../pages/InferenceServicesPage';

describe('InferenceServicesPage', () => {
  it('renders the page heading', () => {
    renderWithProviders(<InferenceServicesPage />);
    expect(
      screen.getByRole('heading', { name: 'Inference Services', level: 1 })
    ).toBeInTheDocument();
  });

  it('renders service cards after data loads', async () => {
    renderWithProviders(<InferenceServicesPage />);
    await waitFor(() => {
      const cards = screen.getAllByText(
        /fraud-detector|recommendation-v2|sentiment-model|churn-predictor/
      );
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  it('shows ready/not-ready badges', async () => {
    renderWithProviders(<InferenceServicesPage />);
    await waitFor(() => {
      const badges = screen.getAllByText(/Ready|Not Ready/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('shows deploy button', () => {
    renderWithProviders(<InferenceServicesPage />);
    expect(screen.getByText('Deploy New Model')).toBeInTheDocument();
  });
});
