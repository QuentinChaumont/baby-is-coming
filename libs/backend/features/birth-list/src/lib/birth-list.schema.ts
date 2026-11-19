import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * The birth list's own settings (nickname, due date, welcome text, payment
 * methods…). One document for the MVP (PRODUCT D1 — single list), with
 * `_id` pinned to {@link MAIN_LIST_ID}; the collection is shaped so more
 * lists can be added later without a migration.
 */
export const MAIN_LIST_ID = 'main';

@Schema({ _id: false })
export class PaymentLinkEntity {
  @Prop({ type: String, required: true })
  label!: string;

  @Prop({ type: String, required: true })
  url!: string;
}
const PaymentLinkSchema = SchemaFactory.createForClass(PaymentLinkEntity);

@Schema({ _id: false })
export class PaymentMethodsEntity {
  @Prop({ type: String, default: null })
  iban!: string | null;

  @Prop({ type: String, default: null })
  ibanHolder!: string | null;

  @Prop({ type: [PaymentLinkSchema], default: [] })
  links!: PaymentLinkEntity[];

  @Prop({ type: String, default: null })
  note!: string | null;
}
const PaymentMethodsSchema = SchemaFactory.createForClass(PaymentMethodsEntity);

@Schema({ timestamps: true, collection: 'birthlists' })
export class BirthList {
  @Prop({ type: String, default: MAIN_LIST_ID })
  _id!: string;

  @Prop({ type: String })
  babyNickname?: string;

  /** Stored as a `YYYY-MM-DD` string: a calendar day, not an instant. */
  @Prop({ type: String, default: null })
  dueDate?: string | null;

  @Prop({ type: String })
  welcomeMessage?: string;

  @Prop({ type: PaymentMethodsSchema, default: () => ({}) })
  paymentMethods?: PaymentMethodsEntity;

  @Prop({ type: Number, default: null })
  kittyGoal?: number | null;

  @Prop({ type: String, default: null })
  anonymizeAt?: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export type BirthListDocument = HydratedDocument<BirthList>;
export const BirthListSchema = SchemaFactory.createForClass(BirthList);
