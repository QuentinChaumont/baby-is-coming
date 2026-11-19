import { expect, test } from '@playwright/test';
import { API_URL } from '../playwright.config';
import { acceptConsent, login } from './support/actions';
import { SEEDED_ADMIN } from './support/seed';

test('back-office kitty: amounts, received / thanked, cancel', async ({ page, request }) => {
  const last = `Promesse${Date.now().toString(36)}`;
  await request.post(`${API_URL}/api/public/contributions`, {
    data: { firstName: 'Zoé', lastName: last, amount: 42, message: 'Pour le cosy' },
  });

  await login(page, SEEDED_ADMIN);
  await acceptConsent(page);
  await page.getByRole('link', { name: 'Cagnotte', exact: true }).click();

  const row = page.locator('.kadm__row').filter({ hasText: last });
  await expect(row).toContainText('42 €');
  await expect(row).toContainText('« Pour le cosy »');

  await row.getByLabel('Reçu').check();
  await page.getByRole('button', { name: 'Pas encore reçues' }).click();
  await expect(page.locator('.kadm__row').filter({ hasText: last })).toHaveCount(0);
  await page.getByRole('button', { name: 'Toutes' }).click();

  await row.getByRole('button', { name: 'Annuler la promesse' }).click();
  await row.getByRole('button', { name: 'Oui' }).click();
  await expect(page.getByText(`Promesse de Zoé ${last} annulée.`)).toBeVisible();
  await expect(page.locator('.kadm__row').filter({ hasText: last })).toHaveCount(0);
});
