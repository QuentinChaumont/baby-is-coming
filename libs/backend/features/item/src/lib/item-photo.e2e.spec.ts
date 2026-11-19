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
import type { AdminItem } from '@org/shared-contracts';
import sharp from 'sharp';
import { ItemModule } from './item.module';
import { MAX_PHOTOS_PER_ITEM } from './item-photo.service';

@Module({
  imports: [AppConfigModule, LoggerModule, AppHttpModule, UserModule, AuthModule, ItemModule],
})
class TestAppModule {}

/** A 3000×2000 JPEG carrying EXIF (incl. a fake GPS position). */
function cameraPhoto(): Promise<Buffer> {
  return sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#8fa98a' } })
    .jpeg()
    .withExif({ IFD0: { Make: 'KikiCam', Copyright: 'parents' }, IFD3: { GPSLatitudeRef: 'N' } })
    .toBuffer();
}

describe('Item photos (e2e, real Mongo instance)', () => {
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

    const created = await fetch(`${baseUrl}/admin/items`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ title: 'Transat', price: 25 }),
    });
    item = (await created.json()) as AdminItem;
  }, 60_000);

  afterAll(async () => {
    await app.close();
    await testMongo.mongod.stop();
  });

  const upload = (data: Buffer, type = 'image/jpeg', auth = true) => {
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(data)], { type }), 'photo.jpg');
    return fetch(`${baseUrl}/admin/items/${item.id}/photos`, {
      method: 'POST',
      headers: auth ? { authorization: `Bearer ${token}` } : {},
      body: form,
    });
  };
  const patchItem = (body: unknown) =>
    fetch(`${baseUrl}/admin/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
  const removePhoto = (photoId: string) =>
    fetch(`${baseUrl}/admin/items/${item.id}/photos/${photoId}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${token}` },
    });

  it('requires the admin role to upload', async () => {
    expect((await upload(await cameraPhoto(), 'image/jpeg', false)).status).toBe(401);
  });

  it('stores two WebP renditions, resized and stripped of metadata', async () => {
    const res = await upload(await cameraPhoto());
    expect(res.status).toBe(201);
    item = (await res.json()) as AdminItem;
    expect(item.photos).toHaveLength(1);

    for (const [url, maxWidth] of [
      [item.photos[0].thumbUrl, 400],
      [item.photos[0].largeUrl, 1200],
    ] as const) {
      const served = await fetch(`${baseUrl}${url.replace('/api', '')}`);
      expect(served.status).toBe(200);
      expect(served.headers.get('content-type')).toBe('image/webp');
      expect(served.headers.get('cache-control')).toContain('immutable');
      const meta = await sharp(Buffer.from(await served.arrayBuffer())).metadata();
      expect(meta.format).toBe('webp');
      expect(meta.width).toBe(maxWidth);
      expect(meta.exif).toBeUndefined();
    }
  });

  it('lets the item be published once it has a photo', async () => {
    expect((await patchItem({ publication: 'published' })).status).toBe(200);
  });

  it('rejects files that are not readable images', async () => {
    const res = await upload(Buffer.from('definitely not a jpeg'));
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe('PHOTO_UNREADABLE');
    expect((await upload(Buffer.from('%PDF-1.7'), 'application/pdf')).status).toBe(400);
  });

  it('caps the number of photos per item', async () => {
    const photo = await cameraPhoto();
    for (let i = item.photos.length; i < MAX_PHOTOS_PER_ITEM; i++) {
      expect((await upload(photo)).status).toBe(201);
    }
    const res = await upload(photo);
    expect(res.status).toBe(400);
    expect(((await res.json()) as { code: string }).code).toBe('TOO_MANY_PHOTOS');
  });

  it('removes a photo and its files, but keeps one on a published item', async () => {
    const current = (await (
      await fetch(`${baseUrl}/admin/items/${item.id}`, { headers: { authorization: `Bearer ${token}` } })
    ).json()) as AdminItem;
    const [first, ...rest] = current.photos;

    const res = await removePhoto(first.id);
    expect(res.status).toBe(200);
    expect((await fetch(`${baseUrl}/media/${first.id}/thumb`)).status).toBe(404);

    for (const photo of rest.slice(0, -1)) await removePhoto(photo.id);
    const last = rest[rest.length - 1];
    const refused = await removePhoto(last.id);
    expect(refused.status).toBe(400);
    expect(((await refused.json()) as { code: string }).code).toBe('PHOTO_REQUIRED');
  });

  it('answers 404 for unknown photos and sizes', async () => {
    expect((await fetch(`${baseUrl}/media/${'a'.repeat(24)}/thumb`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/media/not-an-id/thumb`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/media/${'a'.repeat(24)}/huge`)).status).toBe(404);
  });
});
