/** Someone who found every secret in Kiki's notebook. Only « Prénom N. »
 * is ever stored — never the full last name. */
export interface HallOfFameEntry {
  id: string;
  /** « Prénom N. » */
  name: string;
  createdAt: string;
}

/** `POST /api/public/hall-of-fame` — sign the notebook's hall of fame. */
export interface JoinHallOfFameRequest {
  firstName: string;
  lastName: string;
  /** Honeypot: humans leave it empty. */
  website?: string;
}
