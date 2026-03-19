import { test, expect } from '../fixtures/auth';

test.describe('MLOps', () => {
  test('should display experiments page', async ({ loggedInPage: page }) => {
    await page.goto('/mlops/experiments');
    await expect(page.getByText('Experiments')).toBeVisible();
  });

  test('should display DAG list page', async ({ loggedInPage: page }) => {
    await page.goto('/mlops/pipelines');
    await expect(page.getByText('Airflow DAGs')).toBeVisible();
  });

  test('should display model registry', async ({ loggedInPage: page }) => {
    await page.goto('/mlops/registry');
    await expect(page.getByText('Model Registry')).toBeVisible();
  });
});
