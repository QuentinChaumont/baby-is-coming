import type { CropperPosition } from 'ngx-image-cropper';

/** The site's photo frame (width / height). */
export const PHOTO_RATIO = 4 / 5;

/** Kraft, the colour photo frames already sit on (`--app-color-kraft`). */
export const PADDING_COLOR = '#e6d5b8';

/** Longest side of the padded image: keeps the canvas under iOS's ~16 MP limit. */
const MAX_SIDE = 3200;

export interface PaddedPhoto {
  file: File;
  /** Where the original photo sits in the padded one, as fractions of its size. */
  photo: { x: number; y: number; width: number; height: number };
  /** True when the photo already has the frame's ratio (nothing was added). */
  fits: boolean;
}

/**
 * Puts the photo on a kraft background at the frame's ratio, so the cropper
 * can zoom out up to « the whole photo » (a square gets bands top and
 * bottom, a tall one on the sides). The browser applies the EXIF rotation
 * when drawing.
 */
export async function padToFrame(source: File): Promise<PaddedPhoto> {
  const image = await loadImage(source);
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  let paddedW = w / h > PHOTO_RATIO ? w : h * PHOTO_RATIO;
  let paddedH = w / h > PHOTO_RATIO ? w / PHOTO_RATIO : h;
  const scale = Math.min(1, MAX_SIDE / Math.max(paddedW, paddedH));
  paddedW = Math.round(paddedW * scale);
  paddedH = Math.round(paddedH * scale);
  const drawW = w * scale;
  const drawH = h * scale;
  const x = (paddedW - drawW) / 2;
  const y = (paddedH - drawH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = paddedW;
  canvas.height = paddedH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas');
  ctx.fillStyle = PADDING_COLOR;
  ctx.fillRect(0, 0, paddedW, paddedH);
  ctx.drawImage(image, x, y, drawW, drawH);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.92),
  );
  if (!blob) throw new Error('Canvas export failed');
  return {
    file: new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
    photo: {
      x: x / paddedW,
      y: y / paddedH,
      width: drawW / paddedW,
      height: drawH / paddedH,
    },
    fits: Math.abs(w / h - PHOTO_RATIO) < 0.01,
  };
}

/** Largest frame-ratio crop inside the photo itself (no background), in cropper pixels. */
export function fillFrame(
  padded: PaddedPhoto,
  shown: { width: number; height: number },
): CropperPosition {
  const p = padded.photo;
  const photoW = p.width * shown.width;
  const photoH = p.height * shown.height;
  const width = Math.min(photoW, photoH * PHOTO_RATIO);
  const height = width / PHOTO_RATIO;
  const x1 = p.x * shown.width + (photoW - width) / 2;
  const y1 = p.y * shown.height + (photoH - height) / 2;
  return { x1, y1, x2: x1 + width, y2: y1 + height };
}

/** The whole padded image: the entire photo plus its background bands. */
export function wholePhoto(shown: {
  width: number;
  height: number;
}): CropperPosition {
  return { x1: 0, y1: 0, x2: shown.width, y2: shown.height };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unreadable image'));
    };
    image.src = url;
  });
}
