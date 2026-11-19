import { expect, test } from '@playwright/test';
import { acceptConsent } from './support/actions';
import { apiTake, seedPublishedItem } from './support/catalog';

test.describe('public gift list', () => {
  test('search, taken items behind the switch, stamp and taker', async ({ page }) => {
    const tag = Date.now().toString(36);
    await seedPublishedItem({ title: `Transat ${tag}`, price: 25, description: 'À bascule' });
    const takenId = await seedPublishedItem({ title: `Baignoire ${tag}`, price: 10 });
    await apiTake(takenId, { kind: 'chasse', firstName: 'Paul', lastName: 'Martin' });

    await page.goto('/liste');
    await acceptConsent(page);
    await page.getByRole('searchbox').fill(tag);

    const cards = page.locator('app-item-card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText(`Transat ${tag}`);
    await expect(cards.first()).toContainText('~25 €');

    await page.getByRole('switch', { name: 'Afficher aussi les objets pris' }).click();
    await expect(cards).toHaveCount(2);
    const taken = cards.filter({ hasText: `Baignoire ${tag}` });
    await expect(taken).toContainText('Chassé !');
    await expect(taken).toContainText('par Paul M.');
  });

  test('an empty search says so', async ({ page }) => {
    await page.goto('/liste');
    await acceptConsent(page);
    await page.getByRole('searchbox').fill('zzz-introuvable');
    await expect(page.getByText('Rien ne correspond à « zzz-introuvable »')).toBeVisible();
  });
});
