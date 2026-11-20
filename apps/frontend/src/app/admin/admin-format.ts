import type { AdminParticipation, ParticipationKind } from '@org/shared-contracts';

export const KIND_LABEL: Record<ParticipationKind, string> = {
  chasse: 'Chasse',
  don: 'Don',
  parents: 'Pris par vous',
};

/** « Paul Martin », or a fallback for parents' / anonymized entries. */
export function guestName(p: Pick<AdminParticipation, 'firstName' | 'lastName' | 'kind' | 'anonymized'>): string {
  if (p.kind === 'parents') return 'Vous';
  if (p.anonymized || !p.firstName) return 'Invité anonymisé';
  return `${p.firstName} ${p.lastName ?? ''}`.trim();
}

const EUR = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
export const euros = (n: number) => `${EUR.format(n)} €`;

/** « 120 € », « 80 – 120 € », or « — » when no price was given. */
export function priceRange(price: number | null, max: number | null): string {
  if (price === null) return '—';
  return max !== null && max > price ? `${EUR.format(price)} – ${EUR.format(max)} €` : euros(price);
}

const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const when = (iso: string) => DATE.format(new Date(iso));
