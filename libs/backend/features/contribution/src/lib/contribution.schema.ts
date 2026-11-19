import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** A pledge to the kitty (PRODUCT F5). Personal data (names, message)
 * stays here; guests only ever see totals and visible names. */
@Schema({ timestamps: true, collection: 'contributions' })
export class Contribution {
  @Prop({ type: String, default: 'main', index: true })
  listId!: string;

  @Prop({ type: String, default: null })
  firstName!: string | null;

  @Prop({ type: String, default: null })
  lastName!: string | null;

  @Prop({ type: Boolean, default: false })
  hideName!: boolean;

  /** Whole euros. */
  @Prop({ type: Number, required: true })
  amount!: number;

  @Prop({ type: String, default: null })
  message!: string | null;

  @Prop({ type: Boolean, default: false })
  received!: boolean;

  @Prop({ type: Boolean, default: false })
  thanked!: boolean;

  @Prop({ type: Boolean, default: false })
  anonymized!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ContributionDocument = HydratedDocument<Contribution>;
export const ContributionSchema = SchemaFactory.createForClass(Contribution);
ContributionSchema.index({ listId: 1, createdAt: -1 });
