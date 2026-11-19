import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError, ValidationError } from '@org/backend-core';
import type {
  AdminItem,
  CreateItemRequest,
  ItemPublication,
  PublicItem,
  PublicItemsQuery,
  UpdateItemRequest,
} from '@org/shared-contracts';
import { QueryFilter } from 'mongoose';
import { normalizeSearch, searchTextOf, toAdminItem, toPublicItem } from './item.mapper';
import { ItemRepository } from './item.repository';
import { Item, ItemDocument } from './item.schema';

/** Single list for the MVP (PRODUCT D1). */
export const MAIN_LIST = 'main';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gifts of the list. Guests only ever see `published` items; the parents
 * manage everything else (PRODUCT F2, F8, §6.1).
 */
@Injectable()
export class ItemService {
  constructor(private readonly repository: ItemRepository) {}

  // ── guests ────────────────────────────────────────────────────────────

  async listPublic(query: PublicItemsQuery = {}): Promise<PublicItem[]> {
    const filter: QueryFilter<Item> = { listId: MAIN_LIST, publication: 'published' };
    if (!query.showTaken) {
      filter.$expr = { $lt: ['$takenQuantity', '$quantity'] };
    }
    const q = query.q ? normalizeSearch(query.q) : '';
    if (q) {
      filter.searchText = { $regex: escapeRegex(q) };
    }
    const sort: Record<string, 1 | -1> =
      query.sort === 'price_asc'
        ? { price: 1, position: 1 }
        : query.sort === 'price_desc'
          ? { price: -1, position: 1 }
          : { position: 1 };
    const docs = await this.repository.findSorted(filter, sort);
    return docs.map(toPublicItem);
  }

  async getPublic(id: string): Promise<PublicItem> {
    const doc = await this.repository.findById(id);
    if (!doc || doc.listId !== MAIN_LIST || doc.publication !== 'published') {
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return toPublicItem(doc);
  }

  // ── parents ───────────────────────────────────────────────────────────

  async listAdmin(publication?: ItemPublication): Promise<AdminItem[]> {
    const filter: QueryFilter<Item> = { listId: MAIN_LIST };
    if (publication) filter.publication = publication;
    const docs = await this.repository.findSorted(filter, { position: 1 });
    return docs.map(toAdminItem);
  }

  async getAdmin(id: string): Promise<AdminItem> {
    return toAdminItem(await this.load(id));
  }

  async create(input: CreateItemRequest): Promise<AdminItem> {
    const title = input.title.trim();
    const description = (input.description ?? '').trim();
    const doc = await this.repository.create({
      listId: MAIN_LIST,
      title,
      description,
      price: input.price,
      quantity: input.quantity ?? 1,
      position: (await this.repository.maxPosition(MAIN_LIST)) + 1,
      publication: 'draft',
      searchText: searchTextOf({ title, description }),
    });
    return toAdminItem(doc);
  }

  async update(id: string, patch: UpdateItemRequest): Promise<AdminItem> {
    const current = await this.load(id);
    const set: Partial<Item> = {};

    if (patch.title !== undefined) set.title = patch.title.trim();
    if (patch.description !== undefined) set.description = patch.description.trim();
    if (patch.price !== undefined) set.price = patch.price;
    if (patch.quantity !== undefined) {
      if (patch.quantity < current.takenQuantity) {
        throw new ValidationError(
          'QUANTITY_BELOW_TAKEN',
          `${current.takenQuantity} unit(s) are already taken`,
        );
      }
      set.quantity = patch.quantity;
    }
    if (patch.publication !== undefined) {
      // Guests always see a photo (PRODUCT F2): no photo, no publication.
      if (patch.publication === 'published' && current.photoIds.length === 0) {
        throw new ValidationError('PHOTO_REQUIRED', 'Add a photo before publishing');
      }
      set.publication = patch.publication;
    }
    if (set.title !== undefined || set.description !== undefined) {
      set.searchText = searchTextOf({
        title: set.title ?? current.title,
        description: set.description ?? current.description,
      });
    }

    const updated = await this.repository.updateById(id, { $set: set });
    if (!updated) throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    return toAdminItem(updated);
  }

  /** Hard delete is only for items nobody took; others are archived
   * (PRODUCT R-OBJ-6). */
  async remove(id: string): Promise<void> {
    const doc = await this.load(id);
    if (doc.takenQuantity > 0) {
      throw new ConflictError(
        'ITEM_HAS_PARTICIPATIONS',
        'This item has been taken — archive it instead',
      );
    }
    await this.repository.deleteById(id);
  }

  /** `ids` must list every item of the list exactly once. */
  async reorder(ids: string[]): Promise<AdminItem[]> {
    const unique = new Set(ids);
    const total = await this.repository.count({ listId: MAIN_LIST });
    const known = await this.repository.countByIds(MAIN_LIST, ids);
    if (unique.size !== ids.length || ids.length !== total || known !== total) {
      throw new ValidationError('INVALID_ORDER', 'ids must list every item exactly once');
    }
    await this.repository.reorder(MAIN_LIST, ids);
    return this.listAdmin();
  }

  private async load(id: string): Promise<ItemDocument> {
    const doc = await this.repository.findById(id);
    if (!doc || doc.listId !== MAIN_LIST) {
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return doc;
  }
}
