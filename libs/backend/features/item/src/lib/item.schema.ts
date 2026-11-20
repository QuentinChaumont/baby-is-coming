import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { ItemDestination, ItemPublication, ParticipationKind } from '@org/shared-contracts';
import { HydratedDocument } from 'mongoose';

/** Guest-safe copy of a participation, kept on the item so guest pages
 * need no join. Written atomically with `takenQuantity` (DEV step 2.1). */
@Schema({ _id: false })
export class ItemTaker {
  @Prop({ type: String, required: true })
  participationId!: string;

  @Prop({ type: String, required: true })
  kind!: ParticipationKind;

  /** « Prénom N. », or `null` (hidden name, parents, anonymized). */
  @Prop({ type: String, default: null })
  name!: string | null;
}
const ItemTakerSchema = SchemaFactory.createForClass(ItemTaker);

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

  /** Indicative price, whole euros: exact, or the low end of a range;
   * `null` when unknown. */
  @Prop({ type: Number, default: null })
  price!: number | null;

  /** High end of a price range, or `null`. */
  @Prop({ type: Number, default: null })
  priceMax!: number | null;

  @Prop({ type: Number, default: 1 })
  quantity!: number;

  /** Units taken so far. Maintained atomically by participations (DEV 2.1)
   * so two guests can never take the last unit at once. */
  @Prop({ type: Number, default: 0 })
  takenQuantity!: number;

  @Prop({ type: [ItemTakerSchema], default: [] })
  takers!: ItemTaker[];

  /** The parents' order (drag & drop in the back-office). */
  @Prop({ type: Number, required: true })
  position!: number;

  /** Processed photos, in display order (DEV step 1.3). */
  @Prop({ type: [String], default: [] })
  photoIds!: string[];

  @Prop({ type: String, default: 'draft' })
  publication!: ItemPublication;

  /** Friends' list or kitty (items created before this field are `amis`). */
  @Prop({ type: String, default: 'amis' })
  destination!: ItemDestination;

  /** Kitty items: the parents bought it. */
  @Prop({ type: Boolean, default: false })
  bought!: boolean;

  /** Lower-cased, accent-stripped title + description for search. */
  @Prop({ type: String, default: '' })
  searchText!: string;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ItemDocument = HydratedDocument<Item>;
export const ItemSchema = SchemaFactory.createForClass(Item);
ItemSchema.index({ listId: 1, publication: 1, position: 1 });
