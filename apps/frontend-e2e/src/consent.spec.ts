import { expect, test } from '@playwright/test';

import { acceptConsent } from './support/actions';

test.describe('cookie consent', () => {
  test('the banner shows on the first visit, "Tout accepter" dismisses it for good', async ({
    page,
  }) => {
    await page.goto('/login');
    const banner = page.getByTestId('consent-banner');
    await expect(banner).toBeVisible();

    await page.getByRole('button', { name: 'Tout accepter' }).click();
    await expect(banner).toBeHidden();

    // the decision is stored — a reload must not bring it back
    await page.reload();
    await expect(banner).toBeHidden();
  });

  test('"Personnaliser" reopens the preferences dialog', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Personnaliser' }).click();
    await expect(
      page.getByRole('heading', { name: 'Préférences cookies' }),
    ).toBeVisible();
  });

  test('the cookie policy opens in a new tab and « Retour » leaves it', async ({
    page,
  }) => {
    await page.goto('/login');

    const [policy] = await Promise.all([
      page.waitForEvent('popup'),
      page.getByRole('link', { name: 'politique cookies' }).click(),
    ]);
    await expect(policy).toHaveURL(/\/legal\/cookies$/);
    await expect(
      policy.getByRole('heading', { name: 'Politique cookies' }),
    ).toBeVisible();

    await policy.getByRole('button', { name: /retour/i }).click();
    await expect(policy).not.toHaveURL(/\/legal\/cookies$/);
  });

  test('the legal footer links to the legal notice from any page', async ({
    page,
  }) => {
    await page.goto('/login');
    // the consent banner overlays the footer until it is dismissed
    await acceptConsent(page);

    const footer = page.locator('footer.legal-links');
    await expect(footer).toBeVisible();
    await footer.getByRole('link', { name: 'Mentions légales' }).click();

    await expect(page).toHaveURL(/\/legal\/notice$/);
    await expect(
      page.getByRole('heading', { name: 'Mentions légales' }),
    ).toBeVisible();
    await expect(
      page.locator('.legal').getByText(/Fait avec .* par/),
    ).toBeVisible();
  });
});
