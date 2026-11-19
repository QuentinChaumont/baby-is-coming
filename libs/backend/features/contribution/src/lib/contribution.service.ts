import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { NotFoundError, ValidationError } from '@org/backend-core';
import { BirthListService } from '@org/backend-features-birth-list';
import type {
  AdminContribution,
  PledgeRequest,
  PublicKitty,
  UpdateContributionRequest,
} from '@org/shared-contracts';
import { Model, isValidObjectId } from 'mongoose';
import { Contribution, ContributionDocument } from './contribution.schema';

const MAIN_LIST = 'main';

/** « Paul M. » — same display as the gift takers. */
function displayName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0).toLocaleUpperCase('fr-FR');
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
}

function toAdmin(d: ContributionDocument): AdminContribution {
  return {
    id: d._id.toString(),
    firstName: d.firstName,
    lastName: d.lastName,
    hideName: d.hideName,
    amount: d.amount,
    message: d.message,
    received: d.received,
    thanked: d.thanked,
    anonymized: d.anonymized,
    createdAt: d.createdAt.toISOString(),
  };
}

/** The « J'ai la flemme » kitty: pledges only, paid outside the site
 * (PRODUCT F5, R-CON-1). */
@Injectable()
export class ContributionService {
  constructor(
    @InjectModel(Contribution.name) private readonly model: Model<Contribution>,
    private readonly birthList: BirthListService,
  ) {}

  async pledge(request: PledgeRequest): Promise<PublicKitty> {
    const firstName = request.firstName.trim();
    const lastName = request.lastName.trim();
    if (!firstName || !lastName) {
      throw new ValidationError('NAME_REQUIRED', 'First and last name are required');
    }
    await this.model.create({
      listId: MAIN_LIST,
      firstName,
      lastName,
      hideName: request.hideName ?? false,
      amount: request.amount,
      message: request.message?.trim() || null,
    });
    return this.kitty();
  }

  /** Total and visible names — never an individual amount (PRODUCT D8). */
  async kitty(): Promise<PublicKitty> {
    const docs = await this.model.find({ listId: MAIN_LIST }).sort({ createdAt: 1 }).exec();
    const { kittyGoal } = await this.birthList.getPublic();
    return {
      totalPromised: docs.reduce((sum, d) => sum + d.amount, 0),
      goal: kittyGoal,
      contributorCount: docs.length,
      contributors: docs
        .filter((d) => !d.hideName && !d.anonymized && d.firstName && d.lastName)
        .map((d) => displayName(d.firstName as string, d.lastName as string)),
    };
  }

  async list(): Promise<AdminContribution[]> {
    const docs = await this.model.find({ listId: MAIN_LIST }).sort({ createdAt: -1 }).exec();
    return docs.map(toAdmin);
  }

  async update(id: string, patch: UpdateContributionRequest): Promise<AdminContribution> {
    const set: Partial<Contribution> = {};
    if (patch.received !== undefined) set.received = patch.received;
    if (patch.thanked !== undefined) set.thanked = patch.thanked;
    const doc = isValidObjectId(id)
      ? await this.model.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).exec()
      : null;
    if (!doc) throw new NotFoundError('CONTRIBUTION_NOT_FOUND', 'Contribution not found');
    return toAdmin(doc);
  }

  /** Only the parents cancel a pledge (PRODUCT R-CON-6) — also how a
   * guest's data is erased on request. */
  async cancel(id: string): Promise<void> {
    const doc = isValidObjectId(id) ? await this.model.findByIdAndDelete(id).exec() : null;
    if (!doc) throw new NotFoundError('CONTRIBUTION_NOT_FOUND', 'Contribution not found');
  }
}
