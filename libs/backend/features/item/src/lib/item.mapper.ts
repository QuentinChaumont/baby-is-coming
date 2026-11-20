import type { AdminItem, ItemPhoto, PublicItem } from '@org/shared-contracts';
import { Item, ItemDocument } from './item.schema';

/** Lower-case and strip accents, so « bébé » matches « BEBE ». */
export function normalizeSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function searchTextOf(item: Pick<Item, 'title' | 'description'>): string {
  return normalizeSearch(`${item.title} ${item.description}`);
}

/** Public URLs of a processed photo (served by DEV step 1.3). */
export function photoOf(id: string): ItemPhoto {
  return {
    id,
    thumbUrl: `/api/media/${id}/thumb`,
    largeUrl: `/api/media/${id}/large`,
  };
}

export function toPublicItem(doc: ItemDocument): PublicItem {
  const remaining = Math.max(doc.quantity - doc.takenQuantity, 0);
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    price: doc.price ?? null,
    priceMax: doc.priceMax ?? null,
    quantity: doc.quantity,
    remaining,
    availability: remaining > 0 ? 'available' : 'taken',
    photos: doc.photoIds.map(photoOf),
    takers: (doc.takers ?? []).map(({ kind, name }) => ({ kind, name })),
    destination: doc.destination ?? 'amis',
    bought: doc.destination === 'cagnotte' && !!doc.bought,
  };
}

export function toAdminItem(doc: ItemDocument): AdminItem {
  return {
    ...toPublicItem(doc),
    publication: doc.publication,
    position: doc.position,
    takenQuantity: doc.takenQuantity,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

/**
 * Normalizes a price input: nothing, a single price, or a range. A lone
 * high end becomes the single price; equal ends collapse; `null` when the
 * range is upside down.
 */
export function normalizePrice(
  min: number | null,
  max: number | null,
): { price: number | null; priceMax: number | null } | null {
  if (min === null) return { price: max, priceMax: null };
  if (max === null || max === min) return { price: min, priceMax: null };
  return max > min ? { price: min, priceMax: max } : null;
}

/** Sort keys: unpriced items always last, ranges by their low end going
 * up and their high end going down. */
export function priceSortKey(item: Pick<Item, 'price' | 'priceMax'>, direction: 'asc' | 'desc'): number {
  if (item.price === null || item.price === undefined) return direction === 'asc' ? Infinity : -Infinity;
  return direction === 'asc' ? item.price : (item.priceMax ?? item.price);
}
