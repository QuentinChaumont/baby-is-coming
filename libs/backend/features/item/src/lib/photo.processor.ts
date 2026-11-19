import sharp from 'sharp';

/** The two renditions served for every photo (PRODUCT D20). */
export const PHOTO_SIZES = { thumb: 400, large: 1200 } as const;
export type PhotoSize = keyof typeof PHOTO_SIZES;
export const PHOTO_SIZE_NAMES = Object.keys(PHOTO_SIZES) as PhotoSize[];

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

const WEBP_QUALITY = 80;

export class UnreadableImageError extends Error {}

/**
 * Turns an upload into the served renditions: auto-rotated from EXIF, then
 * resized to fit (never enlarged), encoded as WebP. sharp drops every
 * metadata block on output — EXIF (with the GPS position of the parents'
 * home), XMP, ICC — unless asked to keep it.
 */
export async function processPhoto(input: Buffer): Promise<Record<PhotoSize, Buffer>> {
  try {
    await sharp(input).metadata();
  } catch {
    throw new UnreadableImageError('Unreadable image');
  }
  const out = {} as Record<PhotoSize, Buffer>;
  for (const size of PHOTO_SIZE_NAMES) {
    const width = PHOTO_SIZES[size];
    out[size] = await sharp(input)
      .rotate()
      .resize({ width, height: Math.round(width * 1.25), fit: 'inside', withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  }
  return out;
}
