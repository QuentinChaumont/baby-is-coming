import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppConfigService } from '../config/app-config.service';
import { buildTestConfig } from '../../testing/build-test-config';
import { listenOnRandomPort } from '../../testing/listen-on-random-port';
import { setupSpa } from './setup-spa';

@Controller('api/probe')
class ApiProbeController {
  @Get()
  probe(): { ok: true } {
    return { ok: true };
  }
}

async function createApp(
  spaDir: string | undefined,
): Promise<{ app: INestApplication; baseUrl: string }> {
  @Module({
    controllers: [ApiProbeController],
    providers: [
      {
        provide: AppConfigService,
        useValue: buildTestConfig(spaDir ? { SPA_DIR: spaDir } : {}),
      },
    ],
  })
  class ProbeModule {}

  const app = await NestFactory.create(ProbeModule, { logger: false });
  setupSpa(app);
  const baseUrl = await listenOnRandomPort(app);
  return { app, baseUrl };
}

describe('setupSpa (integration)', () => {
  let spaDir: string;

  beforeAll(() => {
    spaDir = mkdtempSync(join(tmpdir(), 'spa-'));
    writeFileSync(join(spaDir, 'index.html'), '<app-root></app-root>');
    writeFileSync(join(spaDir, 'main-AB12CD34.js'), 'console.log(1)');
    writeFileSync(join(spaDir, 'favicon.svg'), '<svg/>');
  });

  afterAll(() => rmSync(spaDir, { recursive: true, force: true }));

  describe('with SPA_DIR', () => {
    let app: INestApplication;
    let baseUrl: string;

    beforeAll(async () => {
      ({ app, baseUrl } = await createApp(spaDir));
    });

    afterAll(async () => {
      await app.close();
    });

    it.each(['/', '/liste/abc', '/admin/users'])(
      'serves index.html for %s (no-cache)',
      async (path) => {
        const response = await fetch(`${baseUrl}${path}`);
        expect(response.status).toBe(200);
        expect(response.headers.get('cache-control')).toBe('no-cache');
        expect(await response.text()).toBe('<app-root></app-root>');
      },
    );

    it('caches hashed bundles for a year', async () => {
      const response = await fetch(`${baseUrl}/main-AB12CD34.js`);
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toContain('immutable');
    });

    it('caches unhashed files briefly', async () => {
      const response = await fetch(`${baseUrl}/favicon.svg`);
      expect(response.headers.get('cache-control')).toBe(
        'public, max-age=3600',
      );
    });

    it('lets the API answer /api routes', async () => {
      const response = await fetch(`${baseUrl}/api/probe`);
      expect(await response.json()).toEqual({ ok: true });
    });

    it('returns 404 (not index.html) for an unknown API route', async () => {
      const response = await fetch(`${baseUrl}/api/nope`);
      expect(response.status).toBe(404);
    });

    it('returns 404 for a missing file with an extension', async () => {
      const response = await fetch(`${baseUrl}/missing.js`);
      expect(response.status).toBe(404);
    });
  });

  describe('without SPA_DIR', () => {
    it('does not serve anything on /', async () => {
      const { app, baseUrl } = await createApp(undefined);
      const response = await fetch(`${baseUrl}/`);
      expect(response.status).toBe(404);
      await app.close();
    });
  });

  it('fails fast when SPA_DIR has no index.html', async () => {
    await expect(createApp(join(spaDir, 'nope'))).rejects.toThrow(
      /does not exist/,
    );
  });
});
