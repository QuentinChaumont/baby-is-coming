import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { ParticipationKind } from '@org/shared-contracts';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

/** A guest (or the parents on their behalf) taking a gift. Holds the
 * personal data — names and the « petit mot » — that never reach guests
 * (PRODUCT F3, F7, D2, R-RGPD-1). */
@Schema({ timestamps: true, collection: 'participations' })
export class Participation {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, index: true })
  itemId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  kind!: ParticipationKind;

  @Prop({ type: Number, default: 1 })
  quantity!: number;

  @Prop({ type: String, default: null })
  firstName!: string | null;

  @Prop({ type: String, default: null })
  lastName!: string | null;

  @Prop({ type: Boolean, default: false })
  hideName!: boolean;

  @Prop({ type: String, default: null })
  message!: string | null;

  @Prop({ type: Boolean, default: false })
  enteredByParents!: boolean;

  @Prop({ type: Boolean, default: false })
  received!: boolean;

  @Prop({ type: Boolean, default: false })
  thanked!: boolean;

  @Prop({ type: Boolean, default: false })
  anonymized!: boolean;

  createdAt!: Date;
  updatedAt!: Date;
}

export type ParticipationDocument = HydratedDocument<Participation>;
export const ParticipationSchema = SchemaFactory.createForClass(Participation);
ParticipationSchema.index({ createdAt: -1 });
