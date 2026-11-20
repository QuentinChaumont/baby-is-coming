import type { PublicTaker } from './participation.js';

/** Back-office publication state of a gift (PRODUCT §6.1). Only
 * `published` items are visible to guests. */
export type ItemPublication = 'draft' | 'published' | 'archived';

export const ITEM_PUBLICATIONS: readonly ItemPublication[] = [
  'draft',
  'published',
  'archived',
];

/** Where an item lives: the friends' list (guests take it), or the kitty
 * (the parents buy it with the « J'ai la flemme » money). The parents can
 * move an item between the two at any time. */
export type ItemDestination = 'amis' | 'cagnotte';

export const ITEM_DESTINATIONS: readonly ItemDestination[] = [
  'amis',
  'cagnotte',
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
  /** Indicative price, whole euros: the exact price, or the low end of a
   * range — `null` when the parents gave none. */
  price: number | null;
  /** High end of a price range (`null` for a single price or none). */
  priceMax: number | null;
  quantity: number;
  /** Units still available (`quantity` − taken units). */
  remaining: number;
  availability: ItemAvailability;
  photos: ItemPhoto[];
  /** Who took it (one entry per participation), for the stamps and the
   * « par … » line (PRODUCT D5). Kept when the item moves to the kitty. */
  takers: PublicTaker[];
  destination: ItemDestination;
  /** Kitty items only: the parents bought it (« Acheté ! »). */
  bought: boolean;
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
  /** Default `amis`: the friends' list. `cagnotte` lists every kitty item,
   * bought ones included. */
  destination?: ItemDestination;
}

export interface CreateItemRequest {
  title: string;
  description?: string;
  /** Exact price or low end of a range; omit / `null` for none. */
  price?: number | null;
  /** High end of a range; alone, it's read as a single price. */
  priceMax?: number | null;
  quantity?: number;
  /** Default `amis`. */
  destination?: ItemDestination;
}

export interface UpdateItemRequest {
  title?: string;
  description?: string;
  price?: number | null;
  priceMax?: number | null;
  quantity?: number;
  publication?: ItemPublication;
  /** Moving to `amis` clears `bought`. */
  destination?: ItemDestination;
  /** Kitty items only. */
  bought?: boolean;
}

/** `POST /api/admin/items/reorder` — every item id, in the new order. */
export interface ReorderItemsRequest {
  ids: string[];
}
