import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIBAN,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import type { UpdateBirthListRequest } from '@org/shared-contracts';

/** Calendar days only (`YYYY-MM-DD`). */
const ISO_DAY = { strict: true, strictSeparator: true } as const;

class PaymentLinkDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label!: string;

  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  url!: string;
}

/** `null` clears a field; an absent field is left unchanged. */
class PaymentMethodsPatchDto {
  @IsOptional()
  @IsIBAN()
  iban?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  ibanHolder?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ValidateNested({ each: true })
  @Type(() => PaymentLinkDto)
  links?: PaymentLinkDto[];

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string | null;
}

export class UpdateBirthListDto implements UpdateBirthListRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  babyNickname?: string;

  @IsOptional()
  @IsISO8601(ISO_DAY)
  @MaxLength(10)
  dueDate?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  welcomeMessage?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodsPatchDto)
  paymentMethods?: PaymentMethodsPatchDto;

  @IsOptional()
  @IsInt()
  @Min(1)
  kittyGoal?: number | null;

  @IsOptional()
  @IsISO8601(ISO_DAY)
  @MaxLength(10)
  anonymizeAt?: string | null;
}
