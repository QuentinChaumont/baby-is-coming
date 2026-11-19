import { expect, test } from '@playwright/test';
import { acceptConsent, login } from './support/actions';
import { SEEDED_USER } from './support/seed';

test.describe('dashboard shell', () => {
  test('shows the signed-in home and the account menu', async ({ page }) => {
    await login(page, SEEDED_USER);
    await acceptConsent(page);

    await expect(
      page.getByRole('button', { name: 'Account menu' }),
    ).toBeVisible();
    // A role-less account shows no "Roles:" line at all.
    await expect(page.getByText(/^Roles:/)).toHaveCount(0);
  });

  test('the sidenav "Accueil" link returns to /admin from a child route', async ({
    page,
  }) => {
    await login(page, SEEDED_USER);
    await acceptConsent(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Profil' }).click();
    await expect(page).toHaveURL(/\/admin\/profile$/);

    await page.getByRole('link', { name: 'Accueil' }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('dashboard-home')).toBeVisible();

    // after an in-app navigation, focus lands on the content region
    await expect(page.locator('#shell-main')).toBeFocused();
  });

  test('the shell exposes a skip link to the main content', async ({ page }) => {
    await login(page, SEEDED_USER);
    await acceptConsent(page);

    const skip = page.getByRole('link', { name: 'Aller au contenu' });
    await expect(skip).toHaveAttribute('href', '#shell-main');
    await expect(page.locator('#shell-main')).toHaveAttribute('tabindex', '-1');
  });

  test('"Manage cookies" in the account menu reopens the preferences dialog', async ({
    page,
  }) => {
    await login(page, SEEDED_USER);
    await acceptConsent(page);

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Gérer les cookies' }).click();
    await expect(
      page.getByRole('heading', { name: 'Cookie preferences' }),
    ).toBeVisible();
  });
});
