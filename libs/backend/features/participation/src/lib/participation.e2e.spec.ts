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
import { ItemRepository } from '@org/backend-features-item';
import { UserModule, UserService } from '@org/backend-features-user';
import { listenOnRandomPort, startTestMongo, TestMongo } from '@org/backend-testing';
import type { AdminItem, AdminParticipation, PublicItem } from '@org/shared-contracts';
import { ParticipationModule } from './participation.module';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, ParticipationModule],
})
class TestAppModule {}

describe('Participations (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;
  let baseUrl: string;
  let token: string;

  const parent = { email: 'parent@example.com', password: 'Str0ng!Passw0rd' };
  const guest = { kind: 'chasse', firstName: ' Paul ', lastName: 'martin', message: 'Pour Kiki ♥' };

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

    await app.get(UserService).create({ ...parent, firstName: 'Pa', lastName: 'Rent', roles: ['admin'] });
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parent),
    });
    token = ((await login.json()) as { accessToken: string }).accessToken;
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  const admin = (path: string, method = 'GET', body?: unknown) =>
    fetch(`${baseUrl}/admin${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const take = (itemId: string, body: unknown) =>
    fetch(`${baseUrl}/public/items/${itemId}/take`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  async function publishedItem(title: string, quantity = 1): Promise<AdminItem> {
    const item = (await (await admin('/items', 'POST', { title, price: 20, quantity })).json()) as AdminItem;
    await app.get(ItemRepository).updateById(item.id, { $set: { photoIds: ['p'], publication: 'published' } });
    return item;
  }
  const participations = async () =>
    (await (await admin('/participations')).json()) as AdminParticipation[];

  it('lets a guest take an item for good, showing « Prénom N. » publicly', async () => {
    const item = await publishedItem('Poussette');
    const res = await take(item.id, guest);
    expect(res.status).toBe(201);
    const taken = (await res.json()) as PublicItem;
    expect(taken).toMatchObject({ remaining: 0, availability: 'taken', takers: [{ kind: 'chasse', name: 'Paul M.' }] });
    // the message never reaches guests
    expect(JSON.stringify(taken)).not.toContain('Kiki ♥');

    const [p] = await participations();
    expect(p).toMatchObject({
      itemTitle: 'Poussette',
      kind: 'chasse',
      firstName: 'Paul',
      lastName: 'martin',
      message: 'Pour Kiki ♥',
      enteredByParents: false,
      received: false,
      thanked: false,
    });
  });

  it('hides the name on request', async () => {
    const item = await publishedItem('Lit parapluie');
    const res = await take(item.id, { ...guest, kind: 'don', hideName: true });
    expect(((await res.json()) as PublicItem).takers).toEqual([{ kind: 'don', name: null }]);
  });

  it('never lets two guests take the last unit', async () => {
    const item = await publishedItem('Transat');
    const results = await Promise.all(
      Array.from({ length: 5 }, (_, i) => take(item.id, { ...guest, firstName: `G${i}` })),
    );
    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    const body = (await results.find((r) => r.status === 409)?.json()) as { code: string };
    expect(body.code).toBe('ITEM_ALREADY_TAKEN');
    const stored = await app.get(ItemRepository).findById(item.id);
    expect(stored?.takenQuantity).toBe(1);
  });

  it('takes units one by one on multi-unit items', async () => {
    const item = await publishedItem('Bodies 3 mois', 3);
    const first = (await (await take(item.id, { ...guest, quantity: 2 })).json()) as PublicItem;
    expect(first).toMatchObject({ remaining: 1, availability: 'available' });
    expect((await take(item.id, { ...guest, quantity: 2 })).status).toBe(409);
    expect((await take(item.id, guest)).status).toBe(201);
  });

  it('refuses drafts, unknown items and incomplete forms', async () => {
    const draft = (await (await admin('/items', 'POST', { title: 'Brouillon', price: 5 })).json()) as AdminItem;
    expect((await take(draft.id, guest)).status).toBe(404);
    expect((await take('0'.repeat(24), guest)).status).toBe(404);
    const item = await publishedItem('Gigoteuse');
    expect((await take(item.id, { ...guest, lastName: '' })).status).toBe(400);
    expect((await take(item.id, { ...guest, kind: 'parents' })).status).toBe(400);
  });

  it('never lets guests take a kitty item (the parents buy those)', async () => {
    const item = await publishedItem('Lit parapluie');
    await admin(`/items/${item.id}`, 'PATCH', { destination: 'cagnotte' });
    const res = await take(item.id, guest);
    expect(res.status).toBe(409);
    expect(((await res.json()) as { code: string }).code).toBe('ITEM_IN_KITTY');
  });

  it('silently drops honeypot submissions', async () => {
    const item = await publishedItem('Mobile');
    const res = await take(item.id, { ...guest, website: 'https://spam.example' });
    expect(res.status).toBe(201);
    expect((await app.get(ItemRepository).findById(item.id))?.takenQuantity).toBe(0);
  });

  it('lets the parents assign an item on a guest’s behalf, or mark it taken', async () => {
    const draft = (await (await admin('/items', 'POST', { title: 'Chaise haute', price: 30 })).json()) as AdminItem;
    const assigned = await admin(`/items/${draft.id}/participations`, 'POST', {
      kind: 'don',
      firstName: 'Mamie',
      lastName: 'Odile',
    });
    expect(assigned.status).toBe(201);
    expect(await assigned.json()).toMatchObject({ enteredByParents: true, firstName: 'Mamie', itemTitle: 'Chaise haute' });

    const bought = (await (await admin('/items', 'POST', { title: 'Tire-lait', price: 40 })).json()) as AdminItem;
    const res = await admin(`/items/${bought.id}/participations`, 'POST', { kind: 'parents' });
    expect(await res.json()).toMatchObject({ kind: 'parents', firstName: null });
    const item = await app.get(ItemRepository).findById(bought.id);
    expect(item?.takers).toEqual([expect.objectContaining({ kind: 'parents', name: null })]);
  });

  it('tracks « reçu » and « merci envoyé », then cancels to free the item', async () => {
    const item = await publishedItem('Baignoire');
    await take(item.id, guest);
    const p = (await participations()).find((x) => x.itemId === item.id) as AdminParticipation;

    const flagged = await admin(`/participations/${p.id}`, 'PATCH', { received: true, thanked: true });
    expect(await flagged.json()).toMatchObject({ received: true, thanked: true });

    expect((await admin(`/participations/${p.id}`, 'DELETE')).status).toBe(204);
    const freed = await app.get(ItemRepository).findById(item.id);
    expect(freed).toMatchObject({ takenQuantity: 0, takers: [] });
    expect((await take(item.id, guest)).status).toBe(201);
  });

  it('keeps the follow-up behind the admin role', async () => {
    expect((await fetch(`${baseUrl}/admin/participations`)).status).toBe(401);
  });
});
