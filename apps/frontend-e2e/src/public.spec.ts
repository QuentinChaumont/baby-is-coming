import { expect, test } from '@playwright/test';
import { acceptConsent } from './support/actions';

test.describe('public site shell', () => {
  test('a guest moves between home, list and kitty without any sign-in UI', async ({
    page,
  }) => {
    await page.goto('/');
    await acceptConsent(page);
    await expect(page.getByRole('heading', { name: /c'est Kiki/ })).toBeVisible();
    // the public site never offers to sign in (PRODUCT §3)
    await expect(page.getByRole('link', { name: /connexion|se connecter/i })).toHaveCount(0);

    await page.getByRole('link', { name: 'Voir la liste' }).click();
    await expect(page).toHaveURL(/\/liste$/);
    await expect(page.getByRole('heading', { name: 'La liste' })).toBeVisible();

    await page.getByRole('link', { name: 'Cagnotte', exact: true }).click();
    await expect(page).toHaveURL(/\/cagnotte$/);

    await page.getByRole('link', { name: 'Kiki', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('the home shows the parents’ note and the three ways to take part', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Le mot des parents' })).toBeVisible();
    await expect(page.getByText('Fille ou garçon ? Surprise')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Trois façons de jouer' })).toBeVisible();
  });

  test('pages ask search engines not to index them', async ({ page }) => {
    await page.goto('/liste');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });
});
