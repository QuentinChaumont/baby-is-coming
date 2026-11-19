import { expect, test } from '@playwright/test';
import { submitLogin } from './support/actions';
import { SEEDED_USER } from './support/seed';

test.describe('authentication', () => {
  test('register, survive a reload, then sign out', async ({ page }) => {
    const email = `newcomer.${Date.now()}@example.com`;

    await page.goto('/register');
    await page.getByLabel('Prénom').fill('Nora');
    await page.getByLabel('Nom', { exact: true }).fill('New');
    await page.getByLabel('E-mail').fill(email);
    await page.getByLabel('Mot de passe', { exact: true }).fill('Passw0rd!new');
    await page.getByRole('button', { name: 'Créer le compte' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('dashboard-home')).toBeVisible();

    // the access token lives in memory only — a reload must silently refresh
    await page.reload();
    await expect(page.getByTestId('dashboard-home')).toBeVisible();

    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('an unknown URL renders the 404 page; routes set the document title', async ({
    page,
  }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Connexion/);

    await page.goto('/definitely-not-a-route');
    await expect(
      page.getByRole('heading', { name: 'Page introuvable' }),
    ).toBeVisible();
    await expect(page).toHaveTitle(/Page introuvable/);

    await page.getByRole('link', { name: "Retour à l'accueil" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.getByRole('heading', { name: "Coucou, c'est Kiki" }),
    ).toBeVisible();
  });

  test('a wrong password shows an inline error, not a toast', async ({
    page,
  }) => {
    await page.goto('/login');
    await submitLogin(page, { ...SEEDED_USER, password: 'wrong-password' });

    await expect(page.getByRole('alert')).toHaveText(
      /e-mail ou mot de passe invalide/i,
    );
    await expect(page).toHaveURL(/\/login$/);
    // the error interceptor must NOT also raise a snackbar for this
    await expect(page.locator('mat-snack-bar-container')).toHaveCount(0);
  });

  test('a protected route bounces to /login and comes back after signing in', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login\?redirectTo=%2Fadmin$/);

    await submitLogin(page, SEEDED_USER);
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByTestId('dashboard-home')).toBeVisible();
  });
});
