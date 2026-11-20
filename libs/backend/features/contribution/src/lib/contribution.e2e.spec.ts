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
import {
  listenOnRandomPort,
  startTestMongo,
  TestMongo,
} from '@org/backend-testing';
import type { AdminContribution, PublicKitty } from '@org/shared-contracts';
import { ItemRepository } from '@org/backend-features-item';
import { ContributionModule } from './contribution.module';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    AppHttpModule,
    UserModule,
    AuthModule,
    ContributionModule,
  ],
})
class TestAppModule {}

describe('Kitty (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;
  let baseUrl: string;
  let token: string;

  const parent = { email: 'parent@example.com', password: 'Str0ng!Passw0rd' };

  beforeAll(async () => {
    testMongo = await startTestMongo({
      JWT_SECRET: 'test-secret',
      AUTH_RATE_LIMIT_LIMIT: 1000,
    });
    const moduleRef = await Test.createTestingModule({
      imports: [
        TestAppModule,
        MongooseModule.forRoot(testMongo.mongod.getUri()),
      ],
    })
      .overrideProvider(AppConfigService)
      .useValue(testMongo.config)
      .compile();
    app = moduleRef.createNestApplication();
    useRequestIdMiddleware(app);
    app.useGlobalFilters(app.get(GlobalExceptionFilter));
    app.useGlobalPipes(createValidationPipe());
    baseUrl = await listenOnRandomPort(app);

    await app.get(UserService).create({
      ...parent,
      firstName: 'Pa',
      lastName: 'Rent',
      roles: ['admin'],
    });
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

  const pledge = (body: unknown) =>
    fetch(`${baseUrl}/public/contributions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  const admin = (path: string, method = 'GET', body?: unknown) =>
    fetch(`${baseUrl}/admin${path}`, {
      method,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  const kitty = async () =>
    (await (await fetch(`${baseUrl}/public/kitty`)).json()) as PublicKitty;

  it('starts empty', async () => {
    expect(await kitty()).toEqual({
      totalPromised: 0,
      goal: null,
      contributorCount: 0,
      contributors: [],
    });
  });

  it('records pledges and shows the total and visible names, never amounts', async () => {
    expect(
      (
        await pledge({
          firstName: 'Paul',
          lastName: 'Martin',
          amount: 30,
          message: 'Bisous',
        })
      ).status,
    ).toBe(201);
    const res = await pledge({
      firstName: 'Anne',
      lastName: 'Secret',
      amount: 2,
      hideName: true,
    });
    const body = (await res.json()) as PublicKitty;
    expect(body).toEqual({
      totalPromised: 32,
      goal: null,
      contributorCount: 2,
      contributors: ['Paul M.'],
    });
    expect(JSON.stringify(body)).not.toContain('Bisous');
  });

  it('lets the parents follow pledges, mark them received / thanked, and cancel', async () => {
    const list = (await (
      await admin('/contributions')
    ).json()) as AdminContribution[];
    expect(list.map((c) => c.amount)).toEqual([2, 30]);
    const paul = list.find((c) => c.firstName === 'Paul') as AdminContribution;
    expect(paul.message).toBe('Bisous');

    const flagged = await admin(`/contributions/${paul.id}`, 'PATCH', {
      received: true,
      thanked: true,
    });
    expect(await flagged.json()).toMatchObject({
      received: true,
      thanked: true,
    });

    expect((await admin(`/contributions/${paul.id}`, 'DELETE')).status).toBe(
      204,
    );
    expect((await kitty()).totalPromised).toBe(2);
  });

  it('rejects invalid pledges and drops honeypot ones', async () => {
    for (const body of [
      { firstName: 'X', lastName: 'Y', amount: 0 },
      { firstName: 'X', lastName: 'Y', amount: 12.5 },
      { firstName: '', lastName: 'Y', amount: 5 },
    ]) {
      expect((await pledge(body)).status).toBe(400);
    }
    expect(
      (
        await pledge({
          firstName: 'Bot',
          lastName: 'Net',
          amount: 5,
          website: 'x',
        })
      ).status,
    ).toBe(201);
    expect((await kitty()).contributorCount).toBe(1);
  });

  it('keeps the follow-up behind the admin role', async () => {
    expect((await fetch(`${baseUrl}/admin/contributions`)).status).toBe(401);
  });

  it('without a goal set, aims for what the kitty items add up to', async () => {
    await app.get(ItemRepository).create({
      listId: 'main',
      title: 'Lit parapluie',
      price: 40,
      quantity: 2,
      position: 1,
      publication: 'published',
      destination: 'cagnotte',
    });
    expect((await kitty()).goal).toBe(80);
  });

  it('keeps a hall of fame of « Prénom N. », first finders first, never the full name', async () => {
    const join = (body: unknown) =>
      fetch(`${baseUrl}/public/hall-of-fame`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
    expect(
      await (await fetch(`${baseUrl}/public/hall-of-fame`)).json(),
    ).toEqual([]);
    expect((await join({ firstName: 'Paul', lastName: 'martin' })).status).toBe(
      201,
    );
    await join({ firstName: 'Anne', lastName: 'Durand' });
    await join({ firstName: 'Paul', lastName: 'Martin' }); // same name: no second line
    await join({
      firstName: 'Robot',
      lastName: 'Spam',
      website: 'http://spam',
    }); // honeypot
    const list = (await (
      await fetch(`${baseUrl}/public/hall-of-fame`)
    ).json()) as { name: string }[];
    expect(list.map((e) => e.name)).toEqual(['Paul M.', 'Anne D.']);
    expect(JSON.stringify(list)).not.toContain('Martin');
    expect((await join({ firstName: '', lastName: 'X' })).status).toBe(400);
  });

  it('lets the parents remove a name from the hall of fame, and only them', async () => {
    const before = (await (
      await fetch(`${baseUrl}/public/hall-of-fame`)
    ).json()) as { id: string; name: string }[];
    const anne = before.find((e) => e.name === 'Anne D.') as { id: string };
    expect(
      (
        await fetch(`${baseUrl}/admin/hall-of-fame/${anne.id}`, {
          method: 'DELETE',
        })
      ).status,
    ).toBe(401);
    expect((await admin(`/hall-of-fame/${anne.id}`, 'DELETE')).status).toBe(
      204,
    );
    expect((await admin(`/hall-of-fame/${anne.id}`, 'DELETE')).status).toBe(
      404,
    );
    expect((await admin('/hall-of-fame/nope', 'DELETE')).status).toBe(404);
    const after = (await (await admin('/hall-of-fame')).json()) as {
      name: string;
    }[];
    expect(after.map((e) => e.name)).toEqual(['Paul M.']);
  });
});
