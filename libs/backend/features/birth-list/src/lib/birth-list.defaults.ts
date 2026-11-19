import type { AdminBirthList, PaymentMethods } from '@org/shared-contracts';

/** Months after the due date at which guests' data is anonymized when the
 * parents set no explicit date (PRODUCT D13). */
export const DEFAULT_ANONYMIZE_AFTER_MONTHS = 6;

export const DEFAULT_NICKNAME = 'Kiki';

/** The parents' first draft (PRODUCT §7.1), until they edit it. */
export const DEFAULT_WELCOME_MESSAGE = [
  "On l'appelle Kiki pour l'instant : le sexe, on le découvrira à la naissance, pour toi comme pour nous !",
  "On a eu envie de casser un peu les codes, pour le plaisir de te déstabiliser, et surtout pour t'ouvrir au monde de la seconde main. Évitons le neuf, Amazon et le made in China.",
  "C'est plus long : il faut chercher, dénicher la bonne occasion, aller la récupérer… mais tu contribues à deux belles actions. Kiki sera content, et la planète aussi ;)",
  "Et si tu as la flemme ? Participe simplement à la cagnotte « J'ai la flemme », on s'en occupera :)",
].join('\n\n');

export const EMPTY_PAYMENT_METHODS: PaymentMethods = {
  iban: null,
  ibanHolder: null,
  links: [],
  note: null,
};

/** `YYYY-MM-DD` + `months`, clamped to the target month's last day
 * (31 Aug + 6 months → 28/29 Feb). Pure calendar arithmetic, in UTC. */
export function addMonths(isoDay: string, months: number): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  const targetMonth = m - 1 + months;
  const lastDay = new Date(Date.UTC(y, targetMonth + 1, 0)).getUTCDate();
  const date = new Date(Date.UTC(y, targetMonth, Math.min(d, lastDay)));
  return date.toISOString().slice(0, 10);
}

/** The anonymization date actually in force. */
export function effectiveAnonymizeAt(
  list: Pick<AdminBirthList, 'anonymizeAt' | 'dueDate'>,
): string | null {
  if (list.anonymizeAt) return list.anonymizeAt;
  return list.dueDate
    ? addMonths(list.dueDate, DEFAULT_ANONYMIZE_AFTER_MONTHS)
    : null;
}
