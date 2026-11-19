import { expect, test } from '@playwright/test';
import sharp from 'sharp';
import { acceptConsent, login } from './support/actions';
import { SEEDED_ADMIN } from './support/seed';

test.describe('back-office items', () => {
  test('create, add a cropped photo, publish, add a listing — guests see it', async ({ page }) => {
    const title = `Chaise haute ${Date.now().toString(36)}`;
    await login(page, SEEDED_ADMIN);
    await acceptConsent(page);

    await page.getByRole('link', { name: 'Objets', exact: true }).click();
    await page.getByRole('link', { name: 'Ajouter un objet' }).click();
    await page.getByLabel('Titre').fill(title);
    await page.getByLabel(/Description/).fill('Réglable en hauteur');
    await page.getByLabel(/Prix seconde main indicatif/).fill('45');
    await page.getByRole('button', { name: "Créer l'objet" }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    // publishing without a photo is refused, in French
    await page.getByRole('button', { name: 'Publier' }).click();
    await expect(page.getByRole('alert')).toContainText('Ajoute au moins une photo');

    const photo = await sharp({ create: { width: 1200, height: 900, channels: 3, background: '#e6d5b8' } })
      .jpeg()
      .toBuffer();
    await page.locator('input[type="file"]').setInputFiles({ name: 'chaise.jpg', mimeType: 'image/jpeg', buffer: photo });
    await page.getByRole('button', { name: 'Ajouter cette photo' }).click();
    await expect(page.getByRole('img', { name: 'Photo principale' })).toBeVisible();

    await page.getByRole('button', { name: 'Publier' }).click();
    await expect(page.getByRole('status')).toHaveText('Statut : publié.');

    await page.getByLabel(/Lien de l'annonce/).fill('https://www.leboncoin.fr/ad/chaise/77');
    await page.getByLabel('Prix (€)').fill('30');
    await page.getByRole('button', { name: "Ajouter l'annonce" }).click();
    await expect(page.getByText('leboncoin · 30 €')).toBeVisible();

    await page.goto('/liste');
    await page.getByRole('searchbox').fill(title);
    await page.getByRole('link', { name: new RegExp(title) }).click();
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByRole('link', { name: /Leboncoin · 30 €/ })).toBeVisible();
  });

  test('a draft nobody took can be deleted', async ({ page }) => {
    const title = `Doublon ${Date.now().toString(36)}`;
    await login(page, SEEDED_ADMIN);
    await acceptConsent(page);
    await page.goto('/admin/objets/nouveau');
    await page.getByLabel('Titre').fill(title);
    await page.getByLabel(/Prix seconde main indicatif/).fill('5');
    await page.getByRole('button', { name: "Créer l'objet" }).click();
    await page.getByRole('button', { name: "Supprimer l'objet" }).click();
    await page.getByRole('button', { name: 'Oui, supprimer' }).click();
    await expect(page).toHaveURL(/\/admin\/objets$/);
    await expect(page.getByRole('link', { name: title })).toHaveCount(0);
  });
});
