import { expect, test } from '@playwright/test';

test.describe('cookies and legal pages', () => {
  test('guests get no cookie banner — the site sets no tracking cookie', async ({ page, context }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /c'est Kiki/ })).toBeVisible();
    await expect(page.getByTestId('consent-banner')).toHaveCount(0);
    expect(await context.cookies()).toEqual([]);
  });

  test('the footer leads to the cookie policy, and « Retour » leaves it', async ({ page }) => {
    await page.goto('/liste');
    await page.locator('footer.legal-links').getByRole('link', { name: 'Cookies' }).click();
    await expect(page).toHaveURL(/\/legal\/cookies$/);
    await expect(page.getByRole('heading', { name: 'Politique cookies' })).toBeVisible();
    await expect(page.getByText('Aucun cookie, aucun traceur.')).toBeVisible();

    await page.getByRole('button', { name: /retour/i }).click();
    await expect(page).toHaveURL(/\/liste$/);
  });

  test('the legal notice names a private publisher and the host', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer.legal-links').getByRole('link', { name: 'Mentions légales' }).click();
    await expect(page).toHaveURL(/\/legal\/notice$/);
    await expect(page.getByRole('heading', { name: 'Mentions légales' })).toBeVisible();
    await expect(page.getByText(/édité par un particulier/)).toBeVisible();
    await expect(page.getByText(/OVH SAS/)).toBeVisible();
    await expect(page.getByText(/SIREN/)).toHaveCount(0);
  });
});
