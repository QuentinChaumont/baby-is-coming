import sharp from 'sharp';
import { API_URL } from '../../playwright.config';
import { SEEDED_ADMIN } from './seed';

/** Admin access token for the seeded admin (API login, no UI). */
export async function adminToken(): Promise<string> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: SEEDED_ADMIN.email, password: SEEDED_ADMIN.password }),
  });
  if (!res.ok) throw new Error(`admin login failed: ${res.status}`);
  return ((await res.json()) as { accessToken: string }).accessToken;
}

async function call<T>(token: string, path: string, method: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status} ${await res.text()}`);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

/** Creates an item, gives it a generated photo and publishes it — all via
 * the admin API. Returns its id. */
export async function seedPublishedItem(item: {
  title: string;
  price: number;
  description?: string;
  quantity?: number;
}): Promise<string> {
  const token = await adminToken();
  const { id } = await call<{ id: string }>(token, '/admin/items', 'POST', item);

  const photo = await sharp({
    create: { width: 800, height: 1000, channels: 3, background: '#c9d8c4' },
  })
    .jpeg()
    .toBuffer();
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(photo)], { type: 'image/jpeg' }), 'photo.jpg');
  const upload = await fetch(`${API_URL}/api/admin/items/${id}/photos`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}` },
    body: form,
  });
  if (!upload.ok) throw new Error(`photo upload failed: ${upload.status}`);

  await call(token, `/admin/items/${id}`, 'PATCH', { publication: 'published' });
  return id;
}

/** A guest takes an item through the public API. */
export async function apiTake(
  itemId: string,
  guest: { kind: 'chasse' | 'don'; firstName: string; lastName: string; hideName?: boolean },
): Promise<void> {
  const res = await fetch(`${API_URL}/api/public/items/${itemId}/take`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(guest),
  });
  if (!res.ok) throw new Error(`take failed: ${res.status}`);
}
