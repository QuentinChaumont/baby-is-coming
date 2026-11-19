import {
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Roles } from '@org/backend-core';
import type { AdminItem } from '@org/shared-contracts';
import type { Response } from 'express';
import { ItemPhotoService } from './item-photo.service';
import { MediaStorage } from './media.storage';
import { MAX_UPLOAD_BYTES, PHOTO_SIZE_NAMES, PhotoSize } from './photo.processor';

/** Parents upload / remove an item's photos. */
@ApiTags('items')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/items/:itemId/photos')
export class AdminItemPhotosController {
  constructor(private readonly photos: ItemPhotoService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  add(
    @Param('itemId') itemId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype: string } | undefined,
  ): Promise<AdminItem> {
    return this.photos.add(itemId, file);
  }

  @Delete(':photoId')
  remove(@Param('itemId') itemId: string, @Param('photoId') photoId: string): Promise<AdminItem> {
    return this.photos.remove(itemId, photoId);
  }
}

/** Public photo renditions. A photo id never changes content, so the URL
 * is versioned by construction and cached for a year. */
@ApiTags('items')
@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaStorage) {}

  @Get(':photoId/:size')
  async get(
    @Param('photoId') photoId: string,
    @Param('size') size: string,
    @Res() res: Response,
  ): Promise<void> {
    if (!/^[a-f0-9]{24}$/.test(photoId) || !PHOTO_SIZE_NAMES.includes(size as PhotoSize)) {
      throw new NotFoundException();
    }
    const file = await this.media.open(photoId, size as PhotoSize);
    if (!file) throw new NotFoundException();
    res.set({
      'Content-Type': 'image/webp',
      'Content-Length': String(file.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
    });
    file.stream.pipe(res);
  }
}
