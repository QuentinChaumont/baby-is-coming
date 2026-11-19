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
import type { AdminItem, AdminListing, PublicItemDetail } from '@org/shared-contracts';
import { ItemModule } from './item.module';
import { ItemRepository } from './item.repository';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, ItemModule],
})
class TestAppModule {}

describe('Listings (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;
  let baseUrl: string;
  let token: string;
  let item: AdminItem;

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

    await app.get(UserService).create({ ...parent, firstName: 'Pa', lastName: 'Rent', roles: ['admin'] });
    const login = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parent),
    });
    token = ((await login.json()) as { accessToken: string }).accessToken;

    item = (await (await call('/admin/items', 'POST', { title: 'Poussette', price: 120 })).json()) as AdminItem;
    await app.get(ItemRepository).updateById(item.id, { $set: { photoIds: ['p1'], publication: 'published' } });
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  function call(path: string, method = 'GET', body?: unknown) {
    return fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }
  const detail = async () =>
    (await (await fetch(`${baseUrl}/public/items/${item.id}`)).json()) as PublicItemDetail;

  let lbc: AdminListing;

  it('attaches a listing by hand, guessing the platform', async () => {
    const res = await call(`/admin/items/${item.id}/listings`, 'POST', {
      url: 'https://www.leboncoin.fr/ad/poussettes/2400',
      title: ' Poussette Yoyo très bon état ',
      price: 90,
      location: 'Nantes',
    });
    expect(res.status).toBe(201);
    lbc = (await res.json()) as AdminListing;
    expect(lbc).toMatchObject({
      platform: 'leboncoin',
      title: 'Poussette Yoyo très bon état',
      price: 90,
      source: 'manual',
      status: 'active',
      itemId: item.id,
    });
  });

  it('refuses the same ad twice on an item', async () => {
    const res = await call(`/admin/items/${item.id}/listings`, 'POST', {
      url: 'https://www.leboncoin.fr/ad/poussettes/2400',
    });
    expect(res.status).toBe(409);
  });

  it('shows active listings on the public item page, without admin fields', async () => {
    const page = await detail();
    expect(page.listings).toEqual([
      {
        id: lbc.id,
        url: 'https://www.leboncoin.fr/ad/poussettes/2400',
        platform: 'leboncoin',
        title: 'Poussette Yoyo très bon état',
        price: 90,
        location: 'Nantes',
        imageUrl: null,
      },
    ]);
  });

  it('hides masked or expired listings from guests', async () => {
    expect((await call(`/admin/listings/${lbc.id}`, 'PATCH', { status: 'hidden' })).status).toBe(200);
    expect((await detail()).listings).toEqual([]);
    const all = (await (await call(`/admin/items/${item.id}/listings`)).json()) as AdminListing[];
    expect(all.map((l) => l.status)).toEqual(['hidden']);
  });

  it('rejects non-https links and unknown items', async () => {
    expect(
      (await call(`/admin/items/${item.id}/listings`, 'POST', { url: 'http://www.vinted.fr/items/1' })).status,
    ).toBe(400);
    expect(
      (await call(`/admin/items/${'0'.repeat(24)}/listings`, 'POST', { url: 'https://www.vinted.fr/items/1' }))
        .status,
    ).toBe(404);
  });

  it('deletes a listing', async () => {
    expect((await call(`/admin/listings/${lbc.id}`, 'DELETE')).status).toBe(204);
    expect((await call(`/admin/listings/${lbc.id}`, 'DELETE')).status).toBe(404);
  });
});
