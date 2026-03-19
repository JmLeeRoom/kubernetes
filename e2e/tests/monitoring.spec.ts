import { test, expect } from '../fixtures/auth';

test.describe('Monitoring', () => {
  test('should display cluster overview page', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/cluster');
    await expect(page.getByText('Cluster Overview')).toBeVisible();
    await expect(page.getByText('Nodes')).toBeVisible();
    await expect(page.getByText('CPU')).toBeVisible();
    await expect(page.getByText('Memory')).toBeVisible();
  });

  test('should navigate to metrics explorer', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/metrics');
    await expect(page.getByText('Metrics Explorer')).toBeVisible();
    await expect(page.getByPlaceholder(/PromQL/i)).toBeVisible();
  });

  test('should navigate to log viewer', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/logs');
    await expect(page.getByText('Log Viewer')).toBeVisible();
  });

  test('should navigate to trace explorer', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/traces');
    await expect(page.getByText('Trace Explorer')).toBeVisible();
  });

  test('should display alerts page', async ({ loggedInPage: page }) => {
    await page.goto('/monitoring/alerts');
    await expect(page.getByText('Alerts')).toBeVisible();
  });
});
