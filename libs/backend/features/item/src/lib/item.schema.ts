import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { ItemPublication } from '@org/shared-contracts';
import { HydratedDocument } from 'mongoose';

/** A gift of the birth list (PRODUCT F2). */
@Schema({ timestamps: true, collection: 'items' })
export class Item {
  /** Owning list — single list for the MVP (PRODUCT D1). */
  @Prop({ type: String, default: 'main', index: true })
  listId!: string;

  @Prop({ type: String, required: true })
  title!: string;

  @Prop({ type: String, default: '' })
  description!: string;

  /** Indicative second-hand price, whole euros. */
  @Prop({ type: Number, required: true })
  price!: number;

  @Prop({ type: Number, default: 1 })
  quantity!: number;

  /** Units taken so far. Maintained atomically by participations (DEV 2.1)
   * so two guests can never take the last unit at once. */
  @Prop({ type: Number, default: 0 })
  takenQuantity!: number;

  /** The parents' order (drag & drop in the back-office). */
  @Prop({ type: Number, required: true })
  position!: number;

  /** Processed photos, in display order (DEV step 1.3). */
  @Prop({ type: [String], default: [] })
  photoIds!: string[];

  @Prop({ type: String, default: 'draft' })
  publication!: ItemPublication;

  /** Lower-cased, accent-stripped title + description for search. */
  @Prop({ type: String, default: '' })
  searchText!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ItemDocument = HydratedDocument<Item>;
export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ listId: 1, publication: 1, position: 1 });
