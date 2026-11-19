import { expect, test } from '@playwright/test';
import { acceptConsent, login } from './support/actions';
import { seedPublishedItem } from './support/catalog';
import { SEEDED_ADMIN } from './support/seed';

test.describe('back-office participations', () => {
  test('read the « petit mot », tick received / thanked, cancel to free the item', async ({ page, request }) => {
    const title = `Tapis d'éveil ${Date.now().toString(36)}`;
    const id = await seedPublishedItem({ title, price: 20 });
    await request.post(`http://127.0.0.1:3000/api/public/items/${id}/take`, {
      data: { kind: 'chasse', firstName: 'Paul', lastName: 'Martin', message: 'Bon courage pour les nuits' },
    });

    await login(page, SEEDED_ADMIN);
    await acceptConsent(page);
    await page.getByRole('link', { name: 'Participations', exact: true }).click();

    const row = page.locator('.parts__row').filter({ hasText: title });
    await expect(row).toContainText('Paul Martin');
    await expect(row).toContainText('« Bon courage pour les nuits »');

    await row.getByLabel('Reçu').check();
    await row.getByLabel('Merci envoyé').check();
    await page.getByRole('button', { name: 'À remercier' }).click();
    await expect(page.locator('.parts__row').filter({ hasText: title })).toHaveCount(0);
    await page.getByRole('button', { name: 'Toutes' }).click();

    await row.getByRole('button', { name: 'Annuler la participation' }).click();
    await row.getByRole('button', { name: 'Oui' }).click();
    await expect(page.getByRole('status')).toContainText(`« ${title} » est de nouveau disponible`);

    await page.goto(`/objet/${id}`);
    await expect(page.getByRole('button', { name: 'Je pars à la chasse !' })).toBeVisible();
  });

  test('assign an item on a guest’s behalf — guests see it taken', async ({ page }) => {
    const title = `Cosy ${Date.now().toString(36)}`;
    const id = await seedPublishedItem({ title, price: 50 });
    await login(page, SEEDED_ADMIN);
    await acceptConsent(page);
    await page.goto('/admin/participations');

    await page.getByLabel('Objet').selectOption({ label: title });
    await page.getByLabel('Don').check();
    await page.getByLabel('Prénom').fill('Mamie');
    await page.getByLabel('Nom', { exact: true }).fill('Odile');
    await page.getByRole('button', { name: 'Attribuer' }).click();
    await expect(page.getByText(`« ${title} » attribué.`)).toBeVisible();
    await expect(page.locator('.parts__row').filter({ hasText: title })).toContainText('saisie par vous');

    await page.goto(`/objet/${id}`);
    await expect(page.getByText('Cet objet a déjà trouvé preneur (par Mamie O.).')).toBeVisible();
  });
});
