import { Page, expect } from '@playwright/test';

/** Fills and submits the `/login` form (does not assert the outcome). */
export async function submitLogin(
  page: Page,
  creds: { email: string; password: string },
): Promise<void> {
  await page.getByLabel('E-mail').fill(creds.email);
  // exact — a "Show password" reveal button shares the substring.
  await page.getByLabel('Mot de passe', { exact: true }).fill(creds.password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
}

/** Signs in and waits for the dashboard shell. */
export async function login(
  page: Page,
  creds: { email: string; password: string },
): Promise<void> {
  await page.goto('/login');
  await submitLogin(page, creds);
  await expect(page.getByTestId('dashboard-home')).toBeVisible();
}

/** Dismisses the consent banner if it is showing. */
export async function acceptConsent(page: Page): Promise<void> {
  const accept = page.getByRole('button', { name: 'Accept all' });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  }
}
