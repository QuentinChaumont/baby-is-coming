import type { ListingStatus } from '@org/shared-contracts';
import { apiErrorCode } from '../public/public-api.service';

/** Helpers of the item edit page (labels, API error messages, inputs). */
export const LISTING_STATUS_LABEL: Record<ListingStatus, string> = {
  active: 'Visible',
  hidden: 'Masquée',
  expired: 'Expirée',
};

const ERRORS: Record<string, string> = {
  PHOTO_REQUIRED: 'Ajoute au moins une photo avant de publier.',
  QUANTITY_BELOW_TAKEN: 'Impossible : des unités sont déjà prises.',
  ITEM_HAS_PARTICIPATIONS:
    'Cet objet a déjà été pris : archive-le plutôt que de le supprimer.',
  LISTING_DUPLICATE: 'Cette annonce est déjà ajoutée.',
  PRICE_RANGE: 'Le prix « jusqu’à » doit être au-dessus du prix indicatif.',
};
export const errorText = (err: unknown, fallback: string) =>
  ERRORS[apiErrorCode(err) ?? ''] ?? fallback;

/** An optional number field: empty means `null`. */
export function optionalNumber(value: unknown): number | null {
  return value === null || value === undefined || value === ''
    ? null
    : Number(value);
}
