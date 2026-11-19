import { NestFactory } from '@nestjs/core';
import { AppConfigService } from '@org/backend-core';
import { UserService } from '@org/backend-features-user';
import { AppModule } from './app/app.module';

/**
 * Creates a parent (`admin`) account from `SEED_ADMIN_EMAIL` /
 * `SEED_ADMIN_PASSWORD` — run once per parent (PRODUCT D21). The address is
 * typed by whoever runs the script, so it is marked verified. Idempotent:
 * an existing user is promoted to `admin` / marked verified if needed.
 *
 *   pnpm seed:admin      # → nx run @org/backend:seed-admin
 */
async function seedAdmin(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    abortOnError: false,
    logger: ['error', 'warn'],
  });

  try {
    const { email, password } = app.get(AppConfigService).seedAdmin;
    if (!email || !password) {
      throw new Error(
        'Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running seed:admin.',
      );
    }

    const users = app.get(UserService);
    const existing = await users.findByEmail(email);

    if (existing) {
      const isAdmin = existing.roles.includes('admin');
      if (isAdmin && existing.emailVerifiedAt) {
        console.log(`[seed:admin] "${email}" already exists — nothing to do.`);
      } else {
        await users.updateById(existing._id.toString(), {
          roles: isAdmin ? existing.roles : [...existing.roles, 'admin'],
          emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
        });
        console.log(`[seed:admin] "${email}" is now a verified admin.`);
      }
      return;
    }

    await users.create({
      email,
      password,
      firstName: 'Admin',
      lastName: 'User',
      roles: ['admin'],
      emailVerifiedAt: new Date(),
    });
    console.log(`[seed:admin] created admin "${email}".`);
  } finally {
    await app.close();
  }
}

seedAdmin().catch((error: unknown) => {
  console.error(
    `[seed:admin] ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
});
