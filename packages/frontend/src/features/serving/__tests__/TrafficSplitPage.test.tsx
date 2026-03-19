import { describe, expect, it } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import TrafficSplitPage from '../pages/TrafficSplitPage';

describe('TrafficSplitPage', () => {
  it('renders the heading "Traffic Split"', () => {
    renderWithProviders(<TrafficSplitPage />);
    expect(screen.getByRole('heading', { name: 'Traffic Split' })).toBeInTheDocument();
  });

  it('shows model list after data loads', async () => {
    renderWithProviders(<TrafficSplitPage />);
    await waitFor(() => {
      const modelNames = screen.getAllByText(
        /fraud-detector|recommendation-v2|sentiment-model|churn-predictor/
      );
      expect(modelNames.length).toBeGreaterThan(0);
    });
  });

  it('shows placeholder text when no model selected', () => {
    renderWithProviders(<TrafficSplitPage />);
    expect(
      screen.getByText('Select a model to configure traffic split')
    ).toBeInTheDocument();
  });

  it('shows traffic slider when a model is selected', async () => {
    renderWithProviders(<TrafficSplitPage />);
    await waitFor(() => {
      expect(screen.getAllByText(/fraud-detector|recommendation-v2|sentiment-model|churn-predictor/).length).toBeGreaterThan(0);
    });

    const firstModel = screen.getAllByText(/fraud-detector|recommendation-v2|sentiment-model|churn-predictor/)[0];
    firstModel.click();

    await waitFor(() => {
      expect(screen.getByText(/Traffic:/)).toBeInTheDocument();
      expect(screen.getByText('Performance')).toBeInTheDocument();
    });
  });

  it('shows Models heading', () => {
    renderWithProviders(<TrafficSplitPage />);
    expect(screen.getByText('Models')).toBeInTheDocument();
  });
});
