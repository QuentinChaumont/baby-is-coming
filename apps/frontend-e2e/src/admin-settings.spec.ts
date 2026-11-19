import { expect, test } from '@playwright/test';
import { acceptConsent, login } from './support/actions';
import { SEEDED_ADMIN } from './support/seed';

test('settings: due date, welcome text and payment methods reach guests', async ({ page }) => {
  await login(page, SEEDED_ADMIN);
  await acceptConsent(page);
  await page.getByRole('link', { name: 'Réglages', exact: true }).click();

  await page.getByLabel('Date du terme').fill('2027-03-15');
  await page.getByLabel(/Message d'accueil/).fill('Bienvenue dans la savane !');
  await page.getByLabel('Titulaire du compte').fill('Les parents de Kiki');
  await page.getByLabel('IBAN').fill('FR76 3000 6000 0112 3456 7890 189');
  await page.getByRole('button', { name: '+ Ajouter un lien' }).click();
  await page.getByLabel('Nom', { exact: true }).fill('Lydia');
  await page.getByLabel('Lien (https://…)').fill('https://lydia.me/kiki');
  await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
  await expect(page.getByRole('status')).toHaveText('Réglages enregistrés.');
  await expect(page.getByText('Date retenue : 15 septembre 2027')).toBeVisible();

  await page.goto('/');
  await expect(page.getByText('Terme prévu : 15 mars 2027')).toBeVisible();
  await expect(page.getByText('Bienvenue dans la savane !')).toBeVisible();

  await page.goto('/cagnotte');
  await page.getByLabel('Prénom').fill('Léa');
  await page.getByLabel('Nom', { exact: true }).fill('Réglages');
  await page.getByLabel('Montant (€)').fill('10');
  await page.getByRole('button', { name: 'Je promets ma participation' }).click();
  await expect(page.getByText('Virement à Les parents de Kiki')).toBeVisible();
  await expect(page.getByText('FR76 3000 6000 0112 3456 7890 189')).toBeVisible();
  await expect(page.getByRole('link', { name: /Lydia/ })).toBeVisible();
});

test('settings: an invalid IBAN is refused with a French message', async ({ page }) => {
  await login(page, SEEDED_ADMIN);
  await acceptConsent(page);
  await page.goto('/admin/reglages');
  await page.getByLabel('IBAN').fill('pas-un-iban');
  await page.getByRole('button', { name: 'Enregistrer les réglages' }).click();
  await expect(page.getByRole('alert')).toContainText("vérifie l'IBAN");
});
