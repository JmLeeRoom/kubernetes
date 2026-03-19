import { test as base, type Page } from '@playwright/test';

type Role = 'admin' | 'ml-engineer' | 'data-engineer' | 'viewer';

const CREDENTIALS: Record<Role, { email: string; password: string }> = {
  admin: { email: 'admin@company.com', password: 'admin-password' },
  'ml-engineer': { email: 'mleng@company.com', password: 'mleng-password' },
  'data-engineer': { email: 'dataeng@company.com', password: 'dataeng-password' },
  viewer: { email: 'viewer@company.com', password: 'viewer-password' },
};

export async function loginAsUser(page: Page, role: Role = 'admin') {
  const creds = CREDENTIALS[role];
  await page.goto('/login');
  await page.getByLabel('Email').fill(creds.email);
  await page.getByLabel('Password').fill(creds.password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('/', { timeout: 10_000 });
}

export const test = base.extend<{ loggedInPage: Page }>({
  loggedInPage: async ({ page }, use) => {
    await loginAsUser(page, 'admin');
    await use(page);
  },
});

export { expect } from '@playwright/test';
