import { test, expect } from '../fixtures/auth';

test.describe('Pipeline', () => {
  test('should display connections page', async ({ loggedInPage: page }) => {
    await page.goto('/pipeline/connections');
    await expect(page.getByText('Connections')).toBeVisible();
  });

  test('should display flows page', async ({ loggedInPage: page }) => {
    await page.goto('/pipeline/flows');
    await expect(page.getByText('Flows')).toBeVisible();
  });

  test('should display Spark jobs page', async ({ loggedInPage: page }) => {
    await page.goto('/pipeline/jobs');
    await expect(page.getByText('Spark Jobs')).toBeVisible();
  });
});
