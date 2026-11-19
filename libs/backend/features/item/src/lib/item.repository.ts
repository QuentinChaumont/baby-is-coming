import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { BaseRepository } from '@org/backend-database-mongo';
import { Model, QueryFilter, isValidObjectId } from 'mongoose';
import { Item, ItemDocument } from './item.schema';

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
}
