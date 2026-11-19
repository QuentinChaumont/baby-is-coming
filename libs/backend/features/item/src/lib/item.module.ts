import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminItemsController, PublicItemsController } from './item.controller';
import { ItemRepository } from './item.repository';
import { Item, ItemSchema } from './item.schema';
import { ItemService } from './item.service';

/** Gifts of the birth list (DEV step 1.2). */
@Module({
  imports: [MongooseModule.forFeature([{ name: Item.name, schema: ItemSchema }])],
  controllers: [PublicItemsController, AdminItemsController],
  providers: [ItemRepository, ItemService],
  exports: [ItemService, ItemRepository],
})
export class ItemModule {}
