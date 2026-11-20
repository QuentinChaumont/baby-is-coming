import { Injectable } from '@nestjs/common';
import { ConflictError, NotFoundError, ValidationError } from '@org/backend-core';
import type {
  AdminItem,
  CreateItemRequest,
  ItemDestination,
  ItemPublication,
  PublicItem,
  PublicItemDetail,
  PublicItemsQuery,
  UpdateItemRequest,
} from '@org/shared-contracts';
import { QueryFilter } from 'mongoose';
import { normalizePrice, normalizeSearch, priceSortKey, searchTextOf, toAdminItem, toPublicItem } from './item.mapper';
import { ItemRepository } from './item.repository';
import { MAIN_LIST } from './list.constants';
import { ListingService } from './listing.service';
import { MediaStorage } from './media.storage';
import { Item, ItemDocument } from './item.schema';


function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Gifts of the list. Guests only ever see `published` items; the parents
 * manage everything else (PRODUCT F2, F8, §6.1).
 */
@Injectable()
export class ItemService {
  constructor(
    private readonly repository: ItemRepository,
    private readonly media: MediaStorage,
    private readonly listings: ListingService,
  ) {}

  // ── guests ────────────────────────────────────────────────────────────

  async listPublic(query: PublicItemsQuery = {}): Promise<PublicItem[]> {
    const filter: QueryFilter<Item> = { listId: MAIN_LIST, publication: 'published' };
    if (query.destination === 'cagnotte') {
      // The kitty shows everything: what's left to buy and what's bought.
      filter.destination = 'cagnotte';
    } else {
      filter.destination = { $ne: 'cagnotte' };
      if (!query.showTaken) filter.$expr = { $lt: ['$takenQuantity', '$quantity'] };
    }
    const q = query.q ? normalizeSearch(query.q) : '';
    if (q) {
      filter.searchText = { $regex: escapeRegex(q) };
    }
    // Parents' order first; a price sort is stable on top of it, and done
    // here so that items without a price always end up last.
    const docs = await this.repository.findSorted(filter, { position: 1 });
    if (query.sort === 'price_asc' || query.sort === 'price_desc') {
      const direction = query.sort === 'price_asc' ? 'asc' : 'desc';
      const sign = direction === 'asc' ? 1 : -1;
      docs.sort((a, b) => sign * (priceSortKey(a, direction) - priceSortKey(b, direction)) || 0);
    }
    return docs.map(toPublicItem);
  }

  /** The item page: a published item with its active listings. */
  async getPublic(id: string): Promise<PublicItemDetail> {
    const doc = await this.repository.findById(id);
    if (!doc || doc.listId !== MAIN_LIST || doc.publication !== 'published') {
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return { ...toPublicItem(doc), listings: await this.listings.activeForItem(id) };
  }

  // ── parents ───────────────────────────────────────────────────────────

  /** What the kitty's published items add up to (price × quantity) — the
   * kitty goal when the parents set none. */
  async kittyItemsTotal(): Promise<number> {
    const docs = await this.repository.findSorted(
      { listId: MAIN_LIST, publication: 'published', destination: 'cagnotte' },
      { position: 1 },
    );
    // A range counts its high end: better to aim a little high.
    return docs.reduce((sum, d) => sum + (d.priceMax ?? d.price ?? 0) * d.quantity, 0);
  }

  async listAdmin(publication?: ItemPublication, destination?: ItemDestination): Promise<AdminItem[]> {
    const filter: QueryFilter<Item> = { listId: MAIN_LIST };
    if (publication) filter.publication = publication;
    if (destination === 'cagnotte') filter.destination = 'cagnotte';
    else if (destination === 'amis') filter.destination = { $ne: 'cagnotte' };
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
      ...this.prices(input.price ?? null, input.priceMax ?? null),
      quantity: input.quantity ?? 1,
      position: (await this.repository.maxPosition(MAIN_LIST)) + 1,
      publication: 'draft',
      destination: input.destination ?? 'amis',
      searchText: searchTextOf({ title, description }),
    });
    return toAdminItem(doc);
  }

  async update(id: string, patch: UpdateItemRequest): Promise<AdminItem> {
    const current = await this.load(id);
    const set: Partial<Item> = {};

    if (patch.title !== undefined) set.title = patch.title.trim();
    if (patch.description !== undefined) set.description = patch.description.trim();
    if (patch.price !== undefined || patch.priceMax !== undefined) {
      Object.assign(
        set,
        this.prices(
          patch.price !== undefined ? patch.price : (current.price ?? null),
          patch.priceMax !== undefined ? patch.priceMax : (current.priceMax ?? null),
        ),
      );
    }
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
    // Takers are kept when an item moves (the parents' choice); only the
    // kitty knows « bought », so moving back to the friends clears it.
    const destination = patch.destination ?? current.destination ?? 'amis';
    if (patch.destination !== undefined) set.destination = patch.destination;
    if (patch.bought !== undefined) {
      if (patch.bought && destination !== 'cagnotte') {
        throw new ValidationError('NOT_A_KITTY_ITEM', 'Only kitty items can be marked bought');
      }
      set.bought = patch.bought;
    }
    if (destination === 'amis') set.bought = false;
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
    await Promise.all(doc.photoIds.map((photoId) => this.media.deleteAll(photoId)));
    await this.listings.removeForItem(id);
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

  private prices(min: number | null, max: number | null): { price: number | null; priceMax: number | null } {
    const prices = normalizePrice(min, max);
    if (!prices) throw new ValidationError('PRICE_RANGE', 'The high end must be above the low end');
    return prices;
  }

  private async load(id: string): Promise<ItemDocument> {
    const doc = await this.repository.findById(id);
    if (!doc || doc.listId !== MAIN_LIST) {
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return doc;
  }
}
