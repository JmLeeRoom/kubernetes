import { test, expect } from '../fixtures/auth';

test.describe('Serving', () => {
  test('should display inference services list', async ({ loggedInPage: page }) => {
    await page.goto('/serving/models');
    await expect(page.getByText('Inference Services')).toBeVisible();
  });

  test('should open deploy model form', async ({ loggedInPage: page }) => {
    await page.goto('/serving/models');
    const deployBtn = page.getByRole('button', { name: /deploy/i });
    await expect(deployBtn).toBeVisible();
    await deployBtn.click();
    await expect(page.getByText('Deploy Model')).toBeVisible();
  });

  test('should navigate to traffic split page', async ({ loggedInPage: page }) => {
    await page.goto('/serving/traffic');
    await expect(page.getByText('Traffic Split')).toBeVisible();
    await expect(page.getByText(/canary/i)).toBeVisible();
  });
});
