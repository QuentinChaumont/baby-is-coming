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
import { BirthListService } from '@org/backend-features-birth-list';
import { ItemRepository, ItemService } from '@org/backend-features-item';
import { ParticipationService } from '@org/backend-features-participation';
import { UserModule } from '@org/backend-features-user';
import { listenOnRandomPort, startTestMongo, TestMongo } from '@org/backend-testing';
import { ContributionModule } from './contribution.module';
import { ContributionService } from './contribution.service';
import { GuestDataJob } from './guest-data.job';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, ContributionModule],
})
class TestAppModule {}

describe('Guest data anonymization (e2e, real Mongo instance)', () => {
  let testMongo: TestMongo;
  let app: INestApplication;

  beforeAll(async () => {
    testMongo = await startTestMongo({ JWT_SECRET: 'test-secret' });
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
    await listenOnRandomPort(app);
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  it('waits for the date, then wipes names and messages but keeps counts and totals', async () => {
    const item = await app.get(ItemService).create({ title: 'Poussette', price: 120 });
    await app.get(ItemRepository).updateById(item.id, { $set: { photoIds: ['p'], publication: 'published' } });
    await app.get(ParticipationService).take(item.id, {
      kind: 'chasse',
      firstName: 'Paul',
      lastName: 'Martin',
      message: 'Bisous',
    });
    await app.get(ContributionService).pledge({ firstName: 'Zoé', lastName: 'K', amount: 30, message: 'Coucou' });

    const job = app.get(GuestDataJob);
    // no due date yet ⇒ nothing to do
    expect(await job.run('2030-01-01')).toBeNull();

    await app.get(BirthListService).update({ dueDate: '2027-03-15' }); // ⇒ 2027-09-15
    expect(await job.run('2027-09-14')).toBeNull();
    expect(await job.run('2027-09-15')).toEqual({ participations: 1, contributions: 1 });

    const [p] = await app.get(ParticipationService).list();
    expect(p).toMatchObject({ firstName: null, lastName: null, message: null, anonymized: true, itemTitle: 'Poussette' });
    const stored = await app.get(ItemRepository).findById(item.id);
    expect(stored?.takenQuantity).toBe(1);
    expect(stored?.takers.map((t) => t.name)).toEqual([null]);

    const kitty = await app.get(ContributionService).kitty();
    expect(kitty).toMatchObject({ totalPromised: 30, contributorCount: 1, contributors: [] });

    // idempotent
    expect(await job.run('2027-09-16')).toEqual({ participations: 0, contributions: 0 });
  });
});
