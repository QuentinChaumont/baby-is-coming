/** An external payment link shown on the kitty page (Lydia, PayPal.me,
 * Wero…). */
export interface PaymentLink {
  label: string;
  url: string;
}

/** How guests pay a kitty pledge — nothing goes through the site
 * (PRODUCT F5 / R-CON-1). Every field is optional for the parents. */
export interface PaymentMethods {
  iban: string | null;
  ibanHolder: string | null;
  links: PaymentLink[];
  /** Free text, e.g. « En main propre ou par chèque à la naissance ». */
  note: string | null;
}

/** The birth list as guests see it (`GET /api/public/list`). */
export interface PublicBirthList {
  /** Provisional nickname — « Kiki » (PRODUCT D4). */
  babyNickname: string;
  /** Due date, ISO `YYYY-MM-DD`, or `null` if not set yet. */
  dueDate: string | null;
  welcomeMessage: string;
  paymentMethods: PaymentMethods;
  /** Optional kitty goal in whole euros. */
  kittyGoal: number | null;
}

/** The birth list as the parents see it in the back-office
 * (`GET /api/admin/list`). */
export interface AdminBirthList extends PublicBirthList {
  /** Explicit date at which guests' data is anonymized, ISO `YYYY-MM-DD`;
   * `null` ⇒ the default (due date + 6 months, PRODUCT D13). */
  anonymizeAt: string | null;
  /** The date actually used: `anonymizeAt`, else due date + 6 months, else
   * `null` while no due date is set. */
  effectiveAnonymizeAt: string | null;
}

/** `PATCH /api/admin/list` — absent fields are left unchanged; `null`
 * clears a nullable field. */
export interface UpdateBirthListRequest {
  babyNickname?: string;
  dueDate?: string | null;
  welcomeMessage?: string;
  paymentMethods?: Partial<PaymentMethods>;
  kittyGoal?: number | null;
  anonymizeAt?: string | null;
}
