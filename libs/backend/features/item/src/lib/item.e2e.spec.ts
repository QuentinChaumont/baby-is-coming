import { INestApplication, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import {
  AppConfigModule,
  AppConfigService,
  AppHttpModule,
  GlobalExceptionFilter,
  LoggerModule,
  createValidationPipe,
  useRequestIdMiddleware,
} from '@org/backend-core';
import { AuthModule } from '@org/backend-auth';
import { UserModule, UserService } from '@org/backend-features-user';
import { listenOnRandomPort, startTestMongo, TestMongo } from '@org/backend-testing';
import type { AdminItem, PublicItem } from '@org/shared-contracts';
import { ItemModule } from './item.module';
import { ItemRepository } from './item.repository';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, ItemModule],
})
class TestAppModule {}

describe('Items (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;
  let baseUrl: string;
  let token: string;

  const parent = { email: 'parent@example.com', password: 'Str0ng!Passw0rd' };

  beforeAll(async () => {
    testMongo = await startTestMongo({ JWT_SECRET: 'test-secret', AUTH_RATE_LIMIT_LIMIT: 1000 });
    const moduleRef = await Test.createTestingModule({
      imports: [TestAppModule, MongooseModule.forRoot(testMongo.mongod.getUri())],
    })
      .overrideProvider(AppConfigService)
      .useValue(testMongo.config)
      .compile();
    app = moduleRef.createNestApplication();
    useRequestIdMiddleware(app);
    app.useGlobalFilters(app.get(GlobalExceptionFilter));
    app.useGlobalPipes(createValidationPipe());
    baseUrl = await listenOnRandomPort(app);

    await app
      .get(UserService)
      .create({ ...parent, firstName: 'Pa', lastName: 'Rent', roles: ['admin'] });
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parent),
    });
    token = ((await res.json()) as { accessToken: string }).accessToken;
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  const admin = (path: string, init: { method?: string; body?: unknown } = {}) =>
    fetch(`${baseUrl}/admin/items${path}`, {
      method: init.method ?? 'GET',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  const create = async (body: unknown) => (await (await admin('', { method: 'POST', body })).json()) as AdminItem;
  const publicList = async (qs = '') =>
    (await (await fetch(`${baseUrl}/public/items${qs}`)).json()) as PublicItem[];
  /** Photos arrive with DEV step 1.3 — attach a fake one directly. */
  const givePhoto = (id: string) =>
    app.get(ItemRepository).updateById(id, { $set: { photoIds: [`photo-${id}`] } });

  let stroller: AdminItem;
  let bath: AdminItem;
  let scarf: AdminItem;

  it('keeps the parents API behind the admin role', async () => {
    expect((await fetch(`${baseUrl}/admin/items`)).status).toBe(401);
  });

  it('creates drafts in order, invisible to guests', async () => {
    stroller = await create({ title: 'Poussette tout-terrain', description: 'Pliable d’une main', price: 120 });
    bath = await create({ title: 'Baignoire pliable', price: 10, quantity: 2 });
    scarf = await create({ title: 'Écharpe de portage', price: 30 });
    expect(stroller).toMatchObject({
      publication: 'draft',
      position: 1,
      quantity: 1,
      remaining: 1,
      availability: 'available',
      photos: [],
    });
    expect([bath.position, scarf.position]).toEqual([2, 3]);
    expect(await publicList()).toEqual([]);
  });

  it('refuses to publish without a photo', async () => {
    const res = await admin(`/${stroller.id}`, { method: 'PATCH', body: { publication: 'published' } });
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe('PHOTO_REQUIRED');
  });

  it('publishes items with a photo and lists them for guests', async () => {
    for (const item of [stroller, bath, scarf]) {
      await givePhoto(item.id);
      const res = await admin(`/${item.id}`, { method: 'PATCH', body: { publication: 'published' } });
      expect(res.status).toBe(200);
    }
    const list = await publicList();
    expect(list.map((i) => i.title)).toEqual([
      'Poussette tout-terrain',
      'Baignoire pliable',
      'Écharpe de portage',
    ]);
    expect(list[0].photos[0]).toEqual({
      id: `photo-${stroller.id}`,
      thumbUrl: `/api/media/photo-${stroller.id}/thumb`,
      largeUrl: `/api/media/photo-${stroller.id}/large`,
    });
    expect(list[0]).not.toHaveProperty('publication');
  });

  it('searches title and description, ignoring case and accents', async () => {
    expect((await publicList('?q=ECHARPE')).map((i) => i.title)).toEqual(['Écharpe de portage']);
    expect((await publicList('?q=main')).map((i) => i.title)).toEqual(['Poussette tout-terrain']);
    expect(await publicList('?q=.*')).toEqual([]); // regex input is escaped
  });

  it('sorts by price both ways', async () => {
    expect((await publicList('?sort=price_asc')).map((i) => i.price)).toEqual([10, 30, 120]);
    expect((await publicList('?sort=price_desc')).map((i) => i.price)).toEqual([120, 30, 10]);
  });

  it('hides fully taken items unless asked, per unit', async () => {
    const repo = app.get(ItemRepository);
    await repo.updateById(stroller.id, { $set: { takenQuantity: 1 } });
    await repo.updateById(bath.id, { $set: { takenQuantity: 1 } }); // 1 of 2 left

    const visible = await publicList();
    expect(visible.map((i) => i.title)).toEqual(['Baignoire pliable', 'Écharpe de portage']);
    expect(visible[0]).toMatchObject({ remaining: 1, availability: 'available' });

    const all = await publicList('?showTaken=true');
    expect(all[0]).toMatchObject({ title: 'Poussette tout-terrain', remaining: 0, availability: 'taken' });
  });

  it('never drops the quantity below the units already taken', async () => {
    const res = await admin(`/${bath.id}`, { method: 'PATCH', body: { quantity: 0 } });
    expect(res.status).toBe(400);
    const below = await admin(`/${stroller.id}`, { method: 'PATCH', body: { quantity: 1, title: 'Poussette' } });
    expect(below.status).toBe(200);
  });

  it('archives instead of deleting a taken item; deletes untouched ones', async () => {
    expect((await admin(`/${stroller.id}`, { method: 'DELETE' })).status).toBe(409);
    await admin(`/${stroller.id}`, { method: 'PATCH', body: { publication: 'archived' } });
    expect((await publicList('?showTaken=true')).map((i) => i.title)).not.toContain('Poussette');
    expect((await fetch(`${baseUrl}/public/items/${stroller.id}`)).status).toBe(404);

    const temp = await create({ title: 'Doublon', price: 5 });
    expect((await admin(`/${temp.id}`, { method: 'DELETE' })).status).toBe(204);
  });

  it('reorders the whole list, and only the whole list', async () => {
    const partial = await admin('/reorder', { method: 'POST', body: { ids: [scarf.id] } });
    expect(partial.status).toBe(400);

    const res = await admin('/reorder', { method: 'POST', body: { ids: [scarf.id, bath.id, stroller.id] } });
    expect(res.status).toBe(200);
    expect(((await res.json()) as AdminItem[]).map((i) => i.id)).toEqual([scarf.id, bath.id, stroller.id]);
    expect((await publicList()).map((i) => i.title)).toEqual(['Écharpe de portage', 'Baignoire pliable']);
  });

  it('rejects invalid input', async () => {
    for (const body of [{ title: '', price: 1 }, { title: 'X', price: -1 }, { title: 'X', price: 1, quantity: 0 }]) {
      expect((await admin('', { method: 'POST', body })).status).toBe(400);
    }
    expect((await fetch(`${baseUrl}/public/items?sort=random`)).status).toBe(400);
  });

  it('moves items between the friends list and the kitty, keeping their takers', async () => {
    // Baignoire: 1 of 2 already taken by a friend.
    const moved = await admin(`/${bath.id}`, { method: 'PATCH', body: { destination: 'cagnotte' } });
    expect(moved.status).toBe(200);
    expect(await moved.json()).toMatchObject({ destination: 'cagnotte', bought: false, takenQuantity: 1 });

    expect((await publicList('?showTaken=true')).map((i) => i.title)).not.toContain('Baignoire pliable');
    const kitty = await publicList('?destination=cagnotte');
    expect(kitty.map((i) => i.title)).toEqual(['Baignoire pliable']);

    const drafted = await create({ title: 'Lit parapluie', price: 60, destination: 'cagnotte' });
    expect(drafted).toMatchObject({ destination: 'cagnotte', publication: 'draft' });
    expect((await admin('?destination=cagnotte')).status).toBe(200);
    const adminKitty = (await (await admin('?destination=cagnotte')).json()) as AdminItem[];
    expect(adminKitty.map((i) => i.title)).toEqual(['Baignoire pliable', 'Lit parapluie']);
  });

  it('marks kitty items bought — and only kitty items; moving back clears it', async () => {
    const notKitty = await admin(`/${scarf.id}`, { method: 'PATCH', body: { bought: true } });
    expect(notKitty.status).toBe(400);
    expect(((await notKitty.json()) as { code: string }).code).toBe('NOT_A_KITTY_ITEM');

    await admin(`/${bath.id}`, { method: 'PATCH', body: { bought: true } });
    expect((await publicList('?destination=cagnotte'))[0]).toMatchObject({ bought: true });

    const back = await admin(`/${bath.id}`, { method: 'PATCH', body: { destination: 'amis' } });
    expect(await back.json()).toMatchObject({ destination: 'amis', bought: false });
    expect((await publicList()).map((i) => i.title)).toContain('Baignoire pliable');
    expect((await admin(`/${bath.id}`, { method: 'PATCH', body: { destination: 'nowhere' } })).status).toBe(400);
  });

  it('takes a single price, a range, or none at all', async () => {
    const none = await create({ title: 'Mobile musical' });
    expect(none).toMatchObject({ price: null, priceMax: null });
    const range = await create({ title: 'Transat', price: 20, priceMax: 45 });
    expect(range).toMatchObject({ price: 20, priceMax: 45 });
    const maxOnly = await create({ title: 'Veilleuse', priceMax: 15 });
    expect(maxOnly).toMatchObject({ price: 15, priceMax: null });

    const upsideDown = await admin('', { method: 'POST', body: { title: 'X', price: 50, priceMax: 10 } });
    expect(upsideDown.status).toBe(400);
    expect(((await upsideDown.json()) as { code: string }).code).toBe('PRICE_RANGE');

    const cleared = await admin(`/${range.id}`, { method: 'PATCH', body: { price: null, priceMax: null } });
    expect(await cleared.json()).toMatchObject({ price: null, priceMax: null });
    const widened = await admin(`/${range.id}`, { method: 'PATCH', body: { price: 20, priceMax: 45 } });
    expect(await widened.json()).toMatchObject({ price: 20, priceMax: 45 });
    const lowered = await admin(`/${range.id}`, { method: 'PATCH', body: { priceMax: 30 } });
    expect(await lowered.json()).toMatchObject({ price: 20, priceMax: 30 });
  });

  it('sorts ranges by their ends, and unpriced items last both ways', async () => {
    const titles = ['Mobile musical', 'Transat'];
    for (const item of (await (await admin('')).json()) as AdminItem[]) {
      if (!titles.includes(item.title)) continue;
      await givePhoto(item.id);
      await admin(`/${item.id}`, { method: 'PATCH', body: { publication: 'published' } });
    }
    const asc = (await publicList('?sort=price_asc')).map((i) => i.title);
    const desc = (await publicList('?sort=price_desc')).map((i) => i.title);
    expect(asc[asc.length - 1]).toBe('Mobile musical');
    expect(desc[desc.length - 1]).toBe('Mobile musical');
    // Transat (20–30 €) goes up by its low end, down by its high end.
    expect(asc.indexOf('Transat')).toBeLessThan(asc.indexOf('Écharpe de portage'));
    expect(desc.indexOf('Transat')).toBeLessThan(desc.indexOf('Baignoire pliable'));
    expect(asc.indexOf('Baignoire pliable')).toBeLessThan(asc.indexOf('Transat'));
  });
});
