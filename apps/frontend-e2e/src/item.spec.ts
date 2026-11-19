import { expect, test } from '@playwright/test';
import { acceptConsent } from './support/actions';
import { apiTake, seedPublishedItem } from './support/catalog';

test.describe('item page', () => {
  test('a guest goes hunting, with a hidden name, and the item is stamped', async ({ page }) => {
    const title = `Écharpe ${Date.now().toString(36)}`;
    const id = await seedPublishedItem({ title, price: 30, description: 'Tissée, pas élastique' });

    await page.goto(`/objet/${id}`);
    await acceptConsent(page);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();
    await expect(page.getByText("~30 € d'occasion")).toBeVisible();

    await page.getByRole('button', { name: 'Je pars à la chasse !' }).click();
    await page.getByLabel('Prénom').fill('Paul');
    await page.getByLabel('Nom', { exact: true }).fill('Martin');
    await page.getByLabel('Masquer mon nom aux autres invités').check();
    await page.getByLabel(/Un petit mot d'amour/).fill('Pour Kiki');
    await expect(page.getByText('Une fois validé, seuls les parents pourront modifier ou annuler.')).toBeVisible();
    await page.getByRole('button', { name: 'Je pars à la chasse !' }).click();

    await expect(page.getByRole('heading', { name: 'Bonne chasse !' })).toBeVisible();
    await expect(page.getByText('Chassé !')).toBeVisible();

    await page.reload();
    await expect(page.getByText("Cet objet a déjà trouvé preneur (par quelqu'un de discret).")).toBeVisible();
    await expect(page.getByRole('button', { name: 'Je pars à la chasse !' })).toHaveCount(0);
  });

  test('if someone takes it first, the guest is told and nothing breaks', async ({ page }) => {
    const id = await seedPublishedItem({ title: `Trotteur ${Date.now().toString(36)}`, price: 15 });
    await page.goto(`/objet/${id}`);
    await acceptConsent(page);

    await page.getByRole('button', { name: "J'ai déjà ça chez moi !" }).click();
    await page.getByLabel('Prénom').fill('Anne');
    await page.getByLabel('Nom', { exact: true }).fill('Lente');
    await apiTake(id, { kind: 'chasse', firstName: 'Rapide', lastName: 'Gonzales' });
    await page.getByRole('button', { name: 'Je le donne !' }).click();

    await expect(page.getByRole('alert')).toContainText("quelqu'un vient de le prendre juste avant toi");
    await expect(page.getByText('Cet objet a déjà trouvé preneur (par Rapide G.).')).toBeVisible();
  });

  test('« La flemme de chercher » leads to the kitty; unknown items say so', async ({ page }) => {
    const id = await seedPublishedItem({ title: `Mobile ${Date.now().toString(36)}`, price: 12 });
    await page.goto(`/objet/${id}`);
    await acceptConsent(page);
    await page.getByRole('link', { name: 'La flemme de chercher ? La cagnotte' }).click();
    await expect(page).toHaveURL(/\/cagnotte$/);

    await page.goto(`/objet/${'0'.repeat(24)}`);
    await expect(page.getByRole('heading', { name: "Cet objet n'existe pas (ou plus)" })).toBeVisible();
  });
});
