import { expect, test } from '@playwright/test';
import { acceptConsent } from './support/actions';

test.describe('kitty', () => {
  test('a guest pledges, sees the thanks, never an individual amount', async ({ page }) => {
    await page.goto('/cagnotte');
    await acceptConsent(page);
    await expect(page.getByRole('heading', { name: "La cagnotte « J'ai la flemme »" })).toBeVisible();

    await page.getByLabel('Prénom').fill('Zoé');
    await page.getByLabel('Nom', { exact: true }).fill('Kitty');
    await page.getByLabel('Montant (€)').fill('37');
    await page.getByLabel(/Un petit mot d'amour/).fill('Pour les couches');
    await page.getByRole('button', { name: 'Je promets ma participation' }).click();

    await expect(page.getByRole('heading', { name: "Merci ! Plus qu'à faire le geste" })).toBeVisible();
    await expect(page.getByText(/Merci à .*Zoé K\./)).toBeVisible();
    // the total is shown, but no line ever pairs a name with an amount
    await expect(page.getByText(/€ promis/)).toBeVisible();
    await expect(page.getByText('37 €', { exact: true })).toHaveCount(0);
  });

  test('a pledge needs a whole amount', async ({ page }) => {
    await page.goto('/cagnotte');
    await acceptConsent(page);
    await page.getByLabel('Prénom').fill('Zoé');
    await page.getByLabel('Nom', { exact: true }).fill('Kitty');
    await page.getByRole('button', { name: 'Je promets ma participation' }).click();
    await expect(page.getByRole('alert')).toContainText('Indique un montant en euros');
  });
});
