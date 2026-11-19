import { expect, test } from '@playwright/test';
import { acceptConsent, login } from './support/actions';
import { apiTake, seedPublishedItem } from './support/catalog';
import { SEEDED_ADMIN, SEEDED_USER } from './support/seed';

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
      page.getByRole('heading', { name: 'Préférences cookies' }),
    ).toBeVisible();
  });

  test('the parents’ dashboard shows what is new since the last visit', async ({ page }) => {
    const title = `Gigoteuse ${Date.now().toString(36)}`;
    const id = await seedPublishedItem({ title, price: 15 });
    await apiTake(id, { kind: 'don', firstName: 'Mamie', lastName: 'Odile' });

    await login(page, SEEDED_ADMIN);
    await acceptConsent(page);
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();
    await expect(page.getByText(`Mamie Odile a pris « ${title} » (don).`)).toBeVisible();
    await expect(page.getByText('objets publiés')).toBeVisible();
  });
});
