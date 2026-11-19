/** `POST /api/public/contributions` — a pledge to the « J'ai la flemme »
 * kitty (PRODUCT F5, D27). Nothing is paid on the site. */
export interface PledgeRequest {
  firstName: string;
  lastName: string;
  hideName?: boolean;
  /** Whole euros, no minimum (PRODUCT D7). */
  amount: number;
  /** « Un petit mot d'amour » — parents only. */
  message?: string;
  /** Honeypot: humans leave it empty. */
  website?: string;
}

/** `GET /api/public/kitty` — never the individual amounts (PRODUCT D8). */
export interface PublicKitty {
  /** Sum of all pledges, whole euros. */
  totalPromised: number;
  /** The parents' optional goal. */
  goal: number | null;
  /** Number of pledges, hidden names included. */
  contributorCount: number;
  /** « Prénom N. » of contributors who did not hide their name. */
  contributors: string[];
}

export interface AdminContribution {
  id: string;
  firstName: string | null;
  lastName: string | null;
  hideName: boolean;
  amount: number;
  message: string | null;
  /** « Reçu ✓ » — the transfer arrived (PRODUCT R-CON-5). */
  received: boolean;
  thanked: boolean;
  anonymized: boolean;
  createdAt: string;
}

export interface UpdateContributionRequest {
  received?: boolean;
  thanked?: boolean;
}
