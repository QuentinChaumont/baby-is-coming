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
import type { AdminBirthList, PublicBirthList } from '@org/shared-contracts';
import { BirthListModule } from './birth-list.module';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, BirthListModule],
})
class TestAppModule {}

describe('Birth list (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;
  let baseUrl: string;

  const parent = { email: 'parent@example.com', password: 'Str0ng!Passw0rd' };
  const member = { email: 'member@example.com', password: 'Str0ng!Passw0rd' };

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

    const users = app.get(UserService);
    await users.create({ ...parent, firstName: 'Pa', lastName: 'Rent', roles: ['admin'] });
    await users.create({ ...member, firstName: 'Mem', lastName: 'Ber' });
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  const token = async (creds: { email: string; password: string }) => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(creds),
    });
    return ((await res.json()) as { accessToken: string }).accessToken;
  };

  const patch = async (body: unknown, accessToken: string) =>
    fetch(`${baseUrl}/admin/list`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(body),
    });

  it('serves defaults to guests before the parents set anything', async () => {
    const res = await fetch(`${baseUrl}/public/list`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as PublicBirthList;
    expect(body).toMatchObject({
      babyNickname: 'Kiki',
      dueDate: null,
      kittyGoal: null,
      paymentMethods: { iban: null, ibanHolder: null, links: [], note: null },
    });
    expect(body.welcomeMessage).toContain('seconde main');
    // admin-only fields never leak publicly
    expect(body).not.toHaveProperty('anonymizeAt');
    expect(body).not.toHaveProperty('effectiveAnonymizeAt');
  });

  it('keeps the admin view behind the admin role', async () => {
    expect((await fetch(`${baseUrl}/admin/list`)).status).toBe(401);
    const res = await fetch(`${baseUrl}/admin/list`, {
      headers: { authorization: `Bearer ${await token(member)}` },
    });
    expect(res.status).toBe(403);
  });

  it('lets a parent update the list, partially, and guests see it', async () => {
    const accessToken = await token(parent);
    const first = await patch(
      {
        dueDate: '2027-03-15',
        kittyGoal: 300,
        paymentMethods: {
          iban: 'fr76 3000 6000 0112 3456 7890 189',
          ibanHolder: ' Les parents de Kiki ',
          links: [{ label: 'Lydia', url: 'https://lydia.me/kiki' }],
        },
      },
      accessToken,
    );
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({
      dueDate: '2027-03-15',
      kittyGoal: 300,
      anonymizeAt: null,
      effectiveAnonymizeAt: '2027-09-15',
      paymentMethods: { iban: 'FR7630006000011234567890189', ibanHolder: 'Les parents de Kiki' },
    });

    // a later partial patch leaves sibling fields alone
    const second = await patch({ paymentMethods: { note: 'Chèque à la naissance' } }, accessToken);
    const body = (await second.json()) as AdminBirthList;
    expect(body.paymentMethods).toEqual({
      iban: 'FR7630006000011234567890189',
      ibanHolder: 'Les parents de Kiki',
      links: [{ label: 'Lydia', url: 'https://lydia.me/kiki' }],
      note: 'Chèque à la naissance',
    });

    const pub = (await (await fetch(`${baseUrl}/public/list`)).json()) as PublicBirthList;
    expect(pub.dueDate).toBe('2027-03-15');
    expect(pub.paymentMethods.note).toBe('Chèque à la naissance');
  });

  it('clears nullable fields with null and honours an explicit anonymization date', async () => {
    const accessToken = await token(parent);
    const res = await patch({ kittyGoal: null, anonymizeAt: '2027-06-01' }, accessToken);
    expect(await res.json()).toMatchObject({
      kittyGoal: null,
      anonymizeAt: '2027-06-01',
      effectiveAnonymizeAt: '2027-06-01',
    });
  });

  it('rejects invalid input', async () => {
    const accessToken = await token(parent);
    for (const body of [
      { dueDate: '15/03/2027' },
      { kittyGoal: 0 },
      { babyNickname: '' },
      { paymentMethods: { iban: 'not-an-iban' } },
      { paymentMethods: { links: [{ label: 'Lydia', url: 'http://insecure.example' }] } },
    ]) {
      expect((await patch(body, accessToken)).status).toBe(400);
    }
  });
});
