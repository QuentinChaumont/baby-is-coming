import { Injectable } from '@nestjs/common';
import { NotFoundError, ValidationError } from '@org/backend-core';
import type { AdminItem } from '@org/shared-contracts';
import { Types } from 'mongoose';
import { toAdminItem } from './item.mapper';
import { ItemRepository } from './item.repository';
import { MAIN_LIST } from './list.constants';
import { MediaStorage } from './media.storage';
import {
  ACCEPTED_MIME_TYPES,
  PHOTO_SIZE_NAMES,
  UnreadableImageError,
  processPhoto,
} from './photo.processor';

export const MAX_PHOTOS_PER_ITEM = 6;

/** Adds / removes an item's photos (DEV step 1.3). */
@Injectable()
export class ItemPhotoService {
  constructor(
    private readonly items: ItemRepository,
    private readonly media: MediaStorage,
  ) {}

  async add(itemId: string, file: { buffer: Buffer; mimetype: string } | undefined): Promise<AdminItem> {
    const item = await this.items.findById(itemId);
    if (!item || item.listId !== MAIN_LIST) throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    if (!file) throw new ValidationError('PHOTO_MISSING', 'Send the photo in the "file" field');
    if (!ACCEPTED_MIME_TYPES.includes(file.mimetype)) {
      throw new ValidationError('PHOTO_FORMAT', 'Photos must be JPEG, PNG, WebP or HEIC');
    }
    if (item.photoIds.length >= MAX_PHOTOS_PER_ITEM) {
      throw new ValidationError('TOO_MANY_PHOTOS', `At most ${MAX_PHOTOS_PER_ITEM} photos per item`);
    }

    let renditions;
    try {
      renditions = await processPhoto(file.buffer);
    } catch (error) {
      if (error instanceof UnreadableImageError) {
        throw new ValidationError('PHOTO_UNREADABLE', 'This image could not be read');
      }
      throw error;
    }

    const photoId = new Types.ObjectId().toHexString();
    for (const size of PHOTO_SIZE_NAMES) {
      await this.media.save(photoId, size, renditions[size]);
    }
    const updated = await this.items.updateById(itemId, { $push: { photoIds: photoId } });
    if (!updated) {
      await this.media.deleteAll(photoId);
      throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    }
    return toAdminItem(updated);
  }

  async remove(itemId: string, photoId: string): Promise<AdminItem> {
    const item = await this.items.findById(itemId);
    if (!item || item.listId !== MAIN_LIST || !item.photoIds.includes(photoId)) {
      throw new NotFoundError('PHOTO_NOT_FOUND', 'Photo not found');
    }
    // A published item keeps at least one photo (PRODUCT F2).
    if (item.publication === 'published' && item.photoIds.length === 1) {
      throw new ValidationError('PHOTO_REQUIRED', 'A published item needs at least one photo');
    }
    const updated = await this.items.updateById(itemId, { $pull: { photoIds: photoId } });
    await this.media.deleteAll(photoId);
    if (!updated) throw new NotFoundError('ITEM_NOT_FOUND', 'Item not found');
    return toAdminItem(updated);
  }
}
