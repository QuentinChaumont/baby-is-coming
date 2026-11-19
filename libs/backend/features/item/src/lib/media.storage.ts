import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, mongo } from 'mongoose';
import { Readable } from 'node:stream';
import type { PhotoSize } from './photo.processor';

/** Photo renditions in GridFS (bucket `media`), one file per size, named
 * `<photoId>-<size>.webp`. */
@Injectable()
export class MediaStorage {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  private bucket(): mongo.GridFSBucket {
    if (!this.connection.db) throw new Error('Mongo connection not ready');
    return new mongo.GridFSBucket(this.connection.db, { bucketName: 'media' });
  }

  async save(photoId: string, size: PhotoSize, data: Buffer): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      Readable.from(data)
        .pipe(
          this.bucket().openUploadStream(fileName(photoId, size), {
            metadata: { photoId, size, contentType: 'image/webp' },
          }),
        )
        .on('finish', () => resolve())
        .on('error', reject);
    });
  }

  /** `null` when the photo (or that size) does not exist. */
  async open(photoId: string, size: PhotoSize): Promise<{ stream: Readable; length: number } | null> {
    const [file] = await this.bucket().find({ filename: fileName(photoId, size) }).limit(1).toArray();
    if (!file) return null;
    return { stream: this.bucket().openDownloadStream(file._id), length: file.length };
  }

  async deleteAll(photoId: string): Promise<void> {
    const files = await this.bucket().find({ 'metadata.photoId': photoId }).toArray();
    await Promise.all(files.map((f) => this.bucket().delete(f._id)));
  }
}

function fileName(photoId: string, size: PhotoSize): string {
  return `${photoId}-${size}.webp`;
}
