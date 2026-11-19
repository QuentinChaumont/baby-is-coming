import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { AppConfigService } from '../config/app-config.service';

/** Angular's hashed bundle names (`main-AB12CD34.js`, `chunk-Cjx-Waoe.js`). */
const HASHED_ASSET = /-[A-Za-z0-9_-]{8}\.[a-z0-9]+$/;

/**
 * Serves the built Angular SPA from the API process when `SPA_DIR` is set,
 * so production is one image on one host: `/api/*` → Nest, everything
 * else → the SPA. A no-op when unset (dev keeps `nx serve frontend`).
 *
 * - Hashed bundles are cached for a year; other files (favicons…) an hour.
 * - Any other GET outside `/api` with no file extension → `index.html`
 *   (no-cache), so deep links and reloads reach the Angular router. Paths
 *   with an extension that don't exist fall through to Nest's 404.
 *
 * Call after `setupSecurity` (Helmet headers apply to the SPA too).
 */
export function setupSpa(app: INestApplication): void {
  const spaDir = app.get(AppConfigService).http.spaDir;
  if (spaDir === undefined) return;

  const root = resolve(spaDir);
  const indexHtml = join(root, 'index.html');
  if (!existsSync(indexHtml)) {
    throw new Error(`SPA_DIR is set but ${indexHtml} does not exist`);
  }

  (app as NestExpressApplication).useStaticAssets(root, {
    index: false,
    setHeaders: (res, filePath) => {
      res.setHeader(
        'Cache-Control',
        HASHED_ASSET.test(filePath)
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600',
      );
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isPageRequest =
      (req.method === 'GET' || req.method === 'HEAD') &&
      !isApiPath(req.path) &&
      extname(req.path) === '';
    if (!isPageRequest) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(indexHtml);
  });
}

function isApiPath(path: string): boolean {
  return path === '/api' || path.startsWith('/api/');
}
