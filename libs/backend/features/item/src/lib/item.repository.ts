import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '@org/backend-database-mongo';
import { Model, QueryFilter, isValidObjectId } from 'mongoose';
import { Item, ItemDocument, ItemTaker } from './item.schema';

@Injectable()
export class ItemRepository extends BaseRepository<Item> {
  constructor(@InjectModel(Item.name) model: Model<Item>) {
    super(model);
  }

  findSorted(
    filter: QueryFilter<Item>,
    sort: Record<string, 1 | -1>,
  ): Promise<ItemDocument[]> {
    return this.model.find(filter).sort(sort).exec();
  }

  async maxPosition(listId: string): Promise<number> {
    const last = await this.model
      .findOne({ listId })
      .sort({ position: -1 })
      .select({ position: 1 })
      .lean()
      .exec();
    return last?.position ?? 0;
  }

  /** Rewrites positions 1..n following `ids`. */
  async reorder(listId: string, ids: string[]): Promise<void> {
    await this.model.bulkWrite(
      ids.map((id, index) => ({
        updateOne: {
          filter: { _id: id, listId },
          update: { $set: { position: index + 1 } },
        },
      })),
    );
  }

  async countByIds(listId: string, ids: string[]): Promise<number> {
    if (!ids.every((id) => isValidObjectId(id))) return -1;
    return this.model.countDocuments({ listId, _id: { $in: ids } }).exec();
  }

  /**
   * Atomically takes `units` of an item if that many are still free, and
   * records the guest-safe taker. Returns `null` when the item is unknown,
   * not visible (when `publishedOnly`) or not free enough — two guests can
   * never take the last unit at once.
   */
  takeUnits(
    listId: string,
    itemId: string,
    units: number,
    taker: ItemTaker,
    publishedOnly: boolean,
  ): Promise<ItemDocument | null> {
    if (!isValidObjectId(itemId)) return Promise.resolve(null);
    const filter: QueryFilter<Item> = {
      _id: itemId,
      listId,
      $expr: { $lte: [{ $add: ['$takenQuantity', units] }, '$quantity'] },
    };
    // Guests take from the friends' list only, never from the kitty.
    if (publishedOnly) {
      filter.publication = 'published';
      filter.destination = { $ne: 'cagnotte' };
    }
    return this.model
      .findOneAndUpdate(
        filter,
        { $inc: { takenQuantity: units }, $push: { takers: taker } },
        { returnDocument: 'after' },
      )
      .exec();
  }

  /** Gives back the units of a cancelled participation. */
  async releaseUnits(itemId: string, units: number, participationId: string): Promise<void> {
    await this.model
      .updateOne(
        { _id: itemId, 'takers.participationId': participationId },
        { $inc: { takenQuantity: -units }, $pull: { takers: { participationId } } },
      )
      .exec();
  }

  /** Blanks the public names of the given participations (anonymization). */
  async clearTakerNames(participationIds: string[]): Promise<void> {
    if (participationIds.length === 0) return;
    await this.model
      .updateMany(
        { 'takers.participationId': { $in: participationIds } },
        { $set: { 'takers.$[t].name': null } },
        { arrayFilters: [{ 't.participationId': { $in: participationIds } }] },
      )
      .exec();
  }

  findByIds(ids: string[]): Promise<ItemDocument[]> {
    return this.model.find({ _id: { $in: ids.filter((id) => isValidObjectId(id)) } }).exec();
  }
}
