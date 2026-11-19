import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminItemsController, PublicItemsController } from './item.controller';
import { AdminItemPhotosController, MediaController } from './item-photo.controller';
import { ItemPhotoService } from './item-photo.service';
import { MediaStorage } from './media.storage';
import { ItemRepository } from './item.repository';
import { Item, ItemSchema } from './item.schema';
import { ItemService } from './item.service';

/** Gifts of the birth list and their photos (DEV steps 1.2, 1.3). */
@Module({
  imports: [MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }])],
  controllers: [
    PublicItemsController,
    AdminItemsController,
    AdminItemPhotosController,
    MediaController,
  ],
  providers: [ItemRepository, ItemService, ItemPhotoService, MediaStorage],
  exports: [ItemService, ItemRepository],
})
export class ItemModule {}
