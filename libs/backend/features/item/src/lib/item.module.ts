import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminItemsController, PublicItemsController } from './item.controller';
import { AdminItemPhotosController, MediaController } from './item-photo.controller';
import { ItemPhotoService } from './item-photo.service';
import { AdminListingsController } from './listing.controller';
import { Listing, ListingSchema } from './listing.schema';
import { ListingService } from './listing.service';
import { MediaStorage } from './media.storage';
import { ItemRepository } from './item.repository';
import { Item, ItemSchema } from './item.schema';
import { ItemService } from './item.service';

/** Gifts of the birth list, their photos and listings (DEV 1.2 → 1.4). */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Item.name, schema: ItemSchema },
      { name: Listing.name, schema: ListingSchema },
    ]),
  ],
  controllers: [
    PublicItemsController,
    AdminItemsController,
    AdminItemPhotosController,
    MediaController,
    AdminListingsController,
  ],
  providers: [ItemRepository, ItemService, ItemPhotoService, MediaStorage, ListingService],
  exports: [ItemService, ItemRepository, ListingService],
})
export class ItemModule {}
