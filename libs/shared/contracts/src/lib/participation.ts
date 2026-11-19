/** How a gift was taken (PRODUCT F3): hunted second-hand, given from home,
 * or marked taken by the parents with no guest attached. */
export type ParticipationKind = 'chasse' | 'don' | 'parents';

/** Who took an item, as guests see it: never the message, and no name
 * when the guest chose to hide it (`name: null` ⇒ « quelqu'un de discret »). */
export interface PublicTaker {
  kind: ParticipationKind;
  /** « Prénom N. », or `null` when hidden / anonymized / taken by parents. */
  name: string | null;
}

/** `POST /api/public/items/:id/take` — a guest takes a gift, for good. */
export interface TakeItemRequest {
  kind: 'chasse' | 'don';
  firstName: string;
  lastName: string;
  /** « Masquer mon nom aux autres invités ». */
  hideName?: boolean;
  /** « Un petit mot d'amour » — read by the parents only. */
  message?: string;
  /** Units to take (default 1). */
  quantity?: number;
  /** Honeypot: humans leave it empty. */
  website?: string;
}

/** A participation as the parents see it in the back-office. */
export interface AdminParticipation {
  id: string;
  itemId: string;
  itemTitle: string;
  kind: ParticipationKind;
  quantity: number;
  firstName: string | null;
  lastName: string | null;
  hideName: boolean;
  message: string | null;
  /** Entered by the parents on a guest's behalf (PRODUCT F8). */
  enteredByParents: boolean;
  /** « Reçu ✓ » — private to the parents. */
  received: boolean;
  /** « Merci envoyé ✓ » — private to the parents. */
  thanked: boolean;
  /** Guest data wiped (PRODUCT D13). */
  anonymized: boolean;
  createdAt: string;
}

/** `POST /api/admin/items/:id/participations` — the parents assign an item
 * to a guest (`kind` chasse / don, with a name) or mark it taken with no
 * guest (`kind: 'parents'`). */
export interface AssignItemRequest {
  kind: ParticipationKind;
  firstName?: string;
  lastName?: string;
  hideName?: boolean;
  message?: string;
  quantity?: number;
}

export interface UpdateParticipationRequest {
  received?: boolean;
  thanked?: boolean;
}
