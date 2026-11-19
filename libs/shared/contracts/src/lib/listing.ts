import type { PublicItem } from './item.js';

/** Where a second-hand listing lives (PRODUCT F12). */
export type ListingPlatform = 'leboncoin' | 'vinted' | 'facebook' | 'autre';

/** Who added it: the parents by hand (MVP) or Claude's scheduled search
 * (V2, PRODUCT F12). */
export type ListingSource = 'manual' | 'claude';

/** `hidden`: masked by the parents; `expired`: the ad is gone. Guests only
 * see `active` listings. */
export type ListingStatus = 'active' | 'hidden' | 'expired';

export const LISTING_STATUSES: readonly ListingStatus[] = ['active', 'hidden', 'expired'];

/** A listing as guests see it on the item page. */
export interface PublicListing {
  id: string;
  url: string;
  platform: ListingPlatform;
  title: string | null;
  /** Price shown on the ad, whole euros. */
  price: number | null;
  location: string | null;
  imageUrl: string | null;
}

export interface AdminListing extends PublicListing {
  itemId: string;
  source: ListingSource;
  status: ListingStatus;
  foundAt: string;
}

/** `GET /api/public/items/:id` — the item with its active listings. */
export interface PublicItemDetail extends PublicItem {
  listings: PublicListing[];
}

export interface CreateListingRequest {
  url: string;
  title?: string | null;
  price?: number | null;
  location?: string | null;
  imageUrl?: string | null;
}

export interface UpdateListingRequest {
  title?: string | null;
  price?: number | null;
  location?: string | null;
  imageUrl?: string | null;
  status?: ListingStatus;
}
