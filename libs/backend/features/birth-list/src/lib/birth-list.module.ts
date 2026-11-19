import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AdminBirthListController,
  PublicBirthListController,
} from './birth-list.controller';
import { BirthListRepository } from './birth-list.repository';
import { BirthList, BirthListSchema } from './birth-list.schema';
import { BirthListService } from './birth-list.service';

/** The birth list's settings: nickname, due date, welcome text, payment
 * methods, kitty goal, anonymization date (DEV step 1.1). */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BirthList.name, schema: BirthListSchema },
    ]),
  ],
  controllers: [AdminBirthListController, PublicBirthListController],
  providers: [BirthListRepository, BirthListService],
  exports: [BirthListService],
})
export class BirthListModule {}
