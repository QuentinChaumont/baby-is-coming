import { Injectable } from '@nestjs/common';
import { ValidationError } from '@org/backend-core';
import type {
  AdminBirthList,
  PaymentMethods,
  PublicBirthList,
  UpdateBirthListRequest,
} from '@org/shared-contracts';
import { BirthListRepository } from './birth-list.repository';
import { BirthList } from './birth-list.schema';
import {
  DEFAULT_NICKNAME,
  DEFAULT_WELCOME_MESSAGE,
  EMPTY_PAYMENT_METHODS,
  effectiveAnonymizeAt,
} from './birth-list.defaults';

/**
 * The birth list's settings. Readers always get a fully populated object
 * (defaults fill whatever the parents have not set yet); writers send a
 * partial patch.
 */
@Injectable()
export class BirthListService {
  constructor(private readonly repository: BirthListRepository) {}

  async getAdmin(): Promise<AdminBirthList> {
    const doc = await this.repository.loadMain();
    return toAdmin(doc ? (doc.toObject() as BirthList) : null);
  }

  /** The guest-facing subset — never spreads the stored document. */
  async getPublic(): Promise<PublicBirthList> {
    const { babyNickname, dueDate, welcomeMessage, paymentMethods, kittyGoal } =
      await this.getAdmin();
    return { babyNickname, dueDate, welcomeMessage, paymentMethods, kittyGoal };
  }

  async update(patch: UpdateBirthListRequest): Promise<AdminBirthList> {
    const set: Record<string, unknown> = {};
    if (patch.babyNickname !== undefined) {
      const nickname = patch.babyNickname.trim();
      if (!nickname) {
        throw new ValidationError('INVALID_BIRTH_LIST', 'babyNickname must not be empty');
      }
      set['babyNickname'] = nickname;
    }
    if (patch.welcomeMessage !== undefined) {
      set['welcomeMessage'] = patch.welcomeMessage.trim();
    }
    if (patch.dueDate !== undefined) set['dueDate'] = patch.dueDate;
    if (patch.kittyGoal !== undefined) set['kittyGoal'] = patch.kittyGoal;
    if (patch.anonymizeAt !== undefined) set['anonymizeAt'] = patch.anonymizeAt;

    Object.assign(set, paymentSet(patch.paymentMethods));

    const saved = await this.repository.upsertMain(set);
    return toAdmin(saved.toObject() as BirthList);
  }
}

/** `paymentMethods` patch → dotted `$set` paths, so a partial update never
 * clobbers a sibling field. */
function paymentSet(
  payment: UpdateBirthListRequest['paymentMethods'],
): Record<string, unknown> {
  const set: Record<string, unknown> = {};
  if (!payment) return set;
  if (payment.iban !== undefined) {
    set['paymentMethods.iban'] = payment.iban
      ? payment.iban.replace(/\s+/g, '').toUpperCase()
      : null;
  }
  if (payment.ibanHolder !== undefined) {
    set['paymentMethods.ibanHolder'] = payment.ibanHolder?.trim() || null;
  }
  if (payment.note !== undefined) {
    set['paymentMethods.note'] = payment.note?.trim() || null;
  }
  if (payment.links !== undefined) {
    set['paymentMethods.links'] = payment.links.map((l) => ({
      label: l.label.trim(),
      url: l.url.trim(),
    }));
  }
  return set;
}

function toPaymentMethods(stored: BirthList['paymentMethods']): PaymentMethods {
  return {
    iban: stored?.iban ?? EMPTY_PAYMENT_METHODS.iban,
    ibanHolder: stored?.ibanHolder ?? EMPTY_PAYMENT_METHODS.ibanHolder,
    links: (stored?.links ?? []).map(({ label, url }) => ({ label, url })),
    note: stored?.note ?? EMPTY_PAYMENT_METHODS.note,
  };
}

function toAdmin(stored: BirthList | null): AdminBirthList {
  const list = {
    babyNickname: stored?.babyNickname || DEFAULT_NICKNAME,
    dueDate: stored?.dueDate ?? null,
    welcomeMessage: stored?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE,
    paymentMethods: toPaymentMethods(stored?.paymentMethods),
    kittyGoal: stored?.kittyGoal ?? null,
    anonymizeAt: stored?.anonymizeAt ?? null,
  };
  return { ...list, effectiveAnonymizeAt: effectiveAnonymizeAt(list) };
}
