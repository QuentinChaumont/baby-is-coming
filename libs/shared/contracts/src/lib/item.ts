import type { PublicTaker } from './participation.js';

/** Back-office publication state of a gift (PRODUCT §6.1). Only
 * `published` items are visible to guests. */
export type ItemPublication = 'draft' | 'published' | 'archived';

export const ITEM_PUBLICATIONS: readonly ItemPublication[] = [
  'draft',
  'published',
  'archived',
];

/** Guest-facing availability (PRODUCT D11): an item is `taken` once every
 * unit has been taken. */
export type ItemAvailability = 'available' | 'taken';

/** A processed photo of an item (DEV step 1.3). */
export interface ItemPhoto {
  id: string;
  /** ~400 px WebP, for list cards. */
  thumbUrl: string;
  /** ~1200 px WebP, for the item page. */
  largeUrl: string;
}

/** An item as guests see it. */
export interface PublicItem {
  id: string;
  title: string;
  description: string;
  /** Indicative second-hand price, whole euros. */
  price: number;
  quantity: number;
  /** Units still available (`quantity` − taken units). */
  remaining: number;
  availability: ItemAvailability;
  photos: ItemPhoto[];
  /** Who took it (one entry per participation), for the stamps and the
   * « par … » line (PRODUCT D5). */
  takers: PublicTaker[];
}

/** An item as the parents see it in the back-office. */
export interface AdminItem extends PublicItem {
  publication: ItemPublication;
  position: number;
  takenQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export type ItemSort = 'price_asc' | 'price_desc';

/** `GET /api/public/items` query. */
export interface PublicItemsQuery {
  /** Searches title + description (case- and accent-insensitive). */
  q?: string;
  /** Include taken items (default: available only, PRODUCT §5 F2). */
  showTaken?: boolean;
  /** Default: the parents' order. */
  sort?: ItemSort;
}

export interface CreateItemRequest {
  title: string;
  description?: string;
  price: number;
  quantity?: number;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  price?: number;
  quantity?: number;
  publication?: ItemPublication;
}

/** `POST /api/admin/items/reorder` — every item id, in the new order. */
export interface ReorderItemsRequest {
  ids: string[];
}
