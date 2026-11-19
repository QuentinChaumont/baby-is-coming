import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConflictError, NotFoundError, ValidationError } from '@org/backend-core';
import { ItemRepository, MAIN_LIST, toPublicItem } from '@org/backend-features-item';
import type {
  AdminParticipation,
  AssignItemRequest,
  ParticipationKind,
  PublicItem,
  TakeItemRequest,
  UpdateParticipationRequest,
} from '@org/shared-contracts';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Participation, ParticipationDocument } from './participation.schema';

interface Taking {
  kind: ParticipationKind;
  firstName: string | null;
  lastName: string | null;
  hideName: boolean;
  message: string | null;
  quantity: number;
  enteredByParents: boolean;
}

/** « Paul M. » — first name and last initial (as on the approved mock-ups). */
export function displayName(firstName: string, lastName: string): string {
  const initial = lastName.trim().charAt(0).toLocaleUpperCase('fr-FR');
  return initial ? `${firstName.trim()} ${initial}.` : firstName.trim();
}

const clean = (v: string | undefined | null) => v?.trim() || null;

/**
 * Taking gifts (PRODUCT D11 / D25 / R-OBJ-3): a guest takes an item at
 * once and for good; only the parents can give it back (cancel) or assign
 * it on someone's behalf (PRODUCT F8).
 */
@Injectable()
export class ParticipationService {
  constructor(
    @InjectModel(Participation.name) private readonly model: Model<Participation>,
    private readonly items: ItemRepository,
  ) {}

  /** A guest takes a published gift. */
  async take(itemId: string, request: TakeItemRequest): Promise<PublicItem> {
    const firstName = request.firstName.trim();
    const lastName = request.lastName.trim();
    if (!firstName || !lastName) {
      throw new ValidationError('NAME_REQUIRED', 'First and last name are required');
    }
    return this.record(itemId, true, {
      kind: request.kind,
      firstName,
      lastName,
      hideName: request.hideName ?? false,
      message: clean(request.message),
      quantity: request.quantity ?? 1,
      enteredByParents: false,
    });
  }

  /** The parents assign an item to a guest, or mark it taken with no guest
   * (`kind: 'parents'`). Works on drafts too. */
  async assign(itemId: string, request: AssignItemRequest): Promise<AdminParticipation> {
    const isGuest = request.kind !== 'parents';
    const firstName = isGuest ? clean(request.firstName) : null;
    const lastName = isGuest ? clean(request.lastName) : null;
    if (isGuest && (!firstName || !lastName)) {
      throw new ValidationError('NAME_REQUIRED', 'First and last name are required');
    }
    await this.record(itemId, false, {
      kind: request.kind,
      firstName,
      lastName,
      hideName: isGuest ? (request.hideName ?? false) : false,
      message: isGuest ? clean(request.message) : null,
      quantity: request.quantity ?? 1,
      enteredByParents: true,
    });
    const latest = await this.model.findOne({ itemId: new Types.ObjectId(itemId) }).sort({ createdAt: -1 }).exec();
    return (await this.withTitles(latest ? [latest] : []))[0];
  }

  async list(): Promise<AdminParticipation[]> {
    const docs = await this.model.find().sort({ createdAt: -1 }).exec();
    return this.withTitles(docs);
  }

  async update(id: string, patch: UpdateParticipationRequest): Promise<AdminParticipation> {
    const set: Partial<Participation> = {};
    if (patch.received !== undefined) set.received = patch.received;
    if (patch.thanked !== undefined) set.thanked = patch.thanked;
    const doc = isValidObjectId(id)
      ? await this.model.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).exec()
      : null;
    if (!doc) throw new NotFoundError('PARTICIPATION_NOT_FOUND', 'Participation not found');
    return (await this.withTitles([doc]))[0];
  }

  /** The parents cancel a participation: its units become available again
   * (PRODUCT R-OBJ-5). Also how a guest's data is erased on request. */
  async cancel(id: string): Promise<void> {
    const doc = isValidObjectId(id) ? await this.model.findByIdAndDelete(id).exec() : null;
    if (!doc) throw new NotFoundError('PARTICIPATION_NOT_FOUND', 'Participation not found');
    await this.items.releaseUnits(doc.itemId.toString(), doc.quantity, doc._id.toString());
  }

  private async record(itemId: string, publishedOnly: boolean, taking: Taking): Promise<PublicItem> {
    const participationId = new Types.ObjectId();
    const showName = taking.firstName && taking.lastName && !taking.hideName;
    const updated = await this.items.takeUnits(
      MAIN_LIST,
      itemId,
      taking.quantity,
      {
        participationId: participationId.toHexString(),
        kind: taking.kind,
        name: showName ? displayName(taking.firstName as string, taking.lastName as string) : null,
      },
      publishedOnly,
    );
    if (!updated) throw await this.whyNotTaken(itemId, publishedOnly);

    try {
      await this.model.create({ _id: participationId, itemId: new Types.ObjectId(itemId), ...taking });
    } catch (error) {
      await this.items.releaseUnits(itemId, taking.quantity, participationId.toHexString());
      throw error;
    }
    return toPublicItem(updated);
  }

  private async whyNotTaken(itemId: string, publishedOnly: boolean): Promise<Error> {
    const item = await this.items.findById(itemId);
    if (!item || item.listId !== MAIN_LIST || (publishedOnly && item.publication !== 'published')) {
      return new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return new ConflictError(
      'ITEM_ALREADY_TAKEN',
      item.takenQuantity >= item.quantity
        ? 'Someone just took this item'
        : `Only ${item.quantity - item.takenQuantity} unit(s) left`,
    );
  }

  private async withTitles(docs: ParticipationDocument[]): Promise<AdminParticipation[]> {
    const items = await this.items.findByIds([...new Set(docs.map((d) => d.itemId.toString()))]);
    const titles = new Map(items.map((i) => [i._id.toString(), i.title]));
    return docs.map((d) => ({
      id: d._id.toString(),
      itemId: d.itemId.toString(),
      itemTitle: titles.get(d.itemId.toString()) ?? '',
      kind: d.kind,
      quantity: d.quantity,
      firstName: d.firstName,
      lastName: d.lastName,
      hideName: d.hideName,
      message: d.message,
      enteredByParents: d.enteredByParents,
      received: d.received,
      thanked: d.thanked,
      anonymized: d.anonymized,
      createdAt: d.createdAt.toISOString(),
    }));
  }
}
