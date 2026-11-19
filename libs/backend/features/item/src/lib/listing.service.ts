import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConflictError, NotFoundError } from '@org/backend-core';
import type {
  AdminListing,
  CreateListingRequest,
  ListingPlatform,
  ListingSource,
  PublicListing,
  UpdateListingRequest,
} from '@org/shared-contracts';
import { Model, Types, isValidObjectId } from 'mongoose';
import { ItemRepository } from './item.repository';
import { MAIN_LIST } from './list.constants';
import { Listing, ListingDocument } from './listing.schema';

/** Guess the platform from the ad's host name. */
export function platformOf(url: string): ListingPlatform {
  const host = new URL(url).hostname.toLowerCase();
  const is = (domain: string) => host === domain || host.endsWith(`.${domain}`);
  if (is('leboncoin.fr')) return 'leboncoin';
  if (/(^|\.)vinted\.[a-z.]+$/.test(host)) return 'vinted';
  if (is('facebook.com') || is('fb.com')) return 'facebook';
  return 'autre';
}

function toPublic(doc: ListingDocument): PublicListing {
  return {
    id: doc._id.toString(),
    url: doc.url,
    platform: doc.platform,
    title: doc.title,
    price: doc.price,
    location: doc.location,
    imageUrl: doc.imageUrl,
  };
}

function toAdmin(doc: ListingDocument): AdminListing {
  return {
    ...toPublic(doc),
    itemId: doc.itemId.toString(),
    source: doc.source,
    status: doc.status,
    foundAt: doc.foundAt.toISOString(),
  };
}

const clean = (v: string | null | undefined) => (v == null ? v : v.trim() || null);

/** Second-hand ads attached to items (DEV step 1.4). */
@Injectable()
export class ListingService {
  constructor(
    @InjectModel(Listing.name) private readonly model: Model<Listing>,
    private readonly items: ItemRepository,
  ) {}

  async listForItem(itemId: string): Promise<AdminListing[]> {
    await this.assertItem(itemId);
    const docs = await this.model
      .find({ itemId: new Types.ObjectId(itemId) })
      .sort({ foundAt: -1 })
      .exec();
    return docs.map(toAdmin);
  }

  /** Active listings, for the public item page. */
  async activeForItem(itemId: string): Promise<PublicListing[]> {
    const docs = await this.model
      .find({ itemId: new Types.ObjectId(itemId), status: 'active' })
      .sort({ foundAt: -1 })
      .exec();
    return docs.map(toPublic);
  }

  async create(
    itemId: string,
    input: CreateListingRequest,
    source: ListingSource = 'manual',
  ): Promise<AdminListing> {
    await this.assertItem(itemId);
    const url = input.url.trim();
    try {
      const doc = await this.model.create({
        itemId: new Types.ObjectId(itemId),
        url,
        platform: platformOf(url),
        title: clean(input.title) ?? null,
        price: input.price ?? null,
        location: clean(input.location) ?? null,
        imageUrl: clean(input.imageUrl) ?? null,
        source,
      });
      return toAdmin(doc);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictError('LISTING_DUPLICATE', 'This ad is already attached to the item');
      }
      throw error;
    }
  }

  async update(id: string, patch: UpdateListingRequest): Promise<AdminListing> {
    const set: Partial<Listing> = {};
    if (patch.title !== undefined) set.title = clean(patch.title) ?? null;
    if (patch.price !== undefined) set.price = patch.price;
    if (patch.location !== undefined) set.location = clean(patch.location) ?? null;
    if (patch.imageUrl !== undefined) set.imageUrl = clean(patch.imageUrl) ?? null;
    if (patch.status !== undefined) set.status = patch.status;
    const doc = isValidObjectId(id)
      ? await this.model.findByIdAndUpdate(id, { $set: set }, { returnDocument: 'after' }).exec()
      : null;
    if (!doc) throw new NotFoundError('LISTING_NOT_FOUND', 'Listing not found');
    return toAdmin(doc);
  }

  async remove(id: string): Promise<void> {
    const deleted = isValidObjectId(id) ? await this.model.findByIdAndDelete(id).exec() : null;
    if (!deleted) throw new NotFoundError('LISTING_NOT_FOUND', 'Listing not found');
  }

  /** Called when an item is hard-deleted. */
  async removeForItem(itemId: string): Promise<void> {
    await this.model.deleteMany({ itemId: new Types.ObjectId(itemId) }).exec();
  }

  private async assertItem(itemId: string): Promise<void> {
    const item = await this.items.findById(itemId);
    if (!item || item.listId !== MAIN_LIST) {
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
  }
}
