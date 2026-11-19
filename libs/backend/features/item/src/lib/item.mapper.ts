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
    price: doc.price,
    quantity: doc.quantity,
    remaining,
    availability: remaining > 0 ? 'available' : 'taken',
    photos: doc.photoIds.map(photoOf),
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
