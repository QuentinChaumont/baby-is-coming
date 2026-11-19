import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BirthList, BirthListDocument, MAIN_LIST_ID } from './birth-list.schema';

/** Reads / upserts the single birth-list document. */
@Injectable()
export class BirthListRepository {
  constructor(
    @InjectModel(BirthList.name) private readonly model: Model<BirthList>,
  ) {}

  loadMain(): Promise<BirthListDocument | null> {
    return this.model.findById(MAIN_LIST_ID).exec();
  }

  upsertMain(set: Record<string, unknown>): Promise<BirthListDocument> {
    return this.model
      .findByIdAndUpdate(
        MAIN_LIST_ID,
        { $set: set, $setOnInsert: { _id: MAIN_LIST_ID } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec() as Promise<BirthListDocument>;
  }
}
