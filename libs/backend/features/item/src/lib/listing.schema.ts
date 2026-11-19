import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { ListingPlatform, ListingSource, ListingStatus } from '@org/shared-contracts';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** A real second-hand ad attached to an item (PRODUCT F12). */
@Schema({ timestamps: true, collection: 'listings' })
export class Listing {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  itemId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, required: true })
  platform!: ListingPlatform;

  @Prop({ type: String, default: null })
  title!: string | null;

  @Prop({ type: Number, default: null })
  price!: number | null;

  @Prop({ type: String, default: null })
  location!: string | null;

  /** Remote thumbnail of the ad — linked, never copied. */
  @Prop({ type: String, default: null })
  imageUrl!: string | null;

  @Prop({ type: String, default: 'manual' })
  source!: ListingSource;

  @Prop({ type: String, default: 'active' })
  status!: ListingStatus;

  @Prop({ type: Date, default: () => new Date() })
  foundAt!: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ListingDocument = HydratedDocument<Listing>;
export const ListingSchema = SchemaFactory.createForClass(Listing);
// One ad per item at most (anti-duplicate, also for the V2 Claude job).
ListingSchema.index({ itemId: 1, url: 1 }, { unique: true });
