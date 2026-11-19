import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import type {
  AssignItemRequest,
  ParticipationKind,
  TakeItemRequest,
  UpdateParticipationRequest,
} from '@org/shared-contracts';

export class TakeItemDto implements TakeItemRequest {
  @IsIn(['chasse', 'don'])
  kind!: 'chasse' | 'don';

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName!: string;

  @IsOptional()
  @IsBoolean()
  hideName?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;

  /** Honeypot — see `PublicParticipationsController.take`. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class AssignItemDto implements AssignItemRequest {
  @IsIn(['chasse', 'don', 'parents'])
  kind!: ParticipationKind;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  lastName?: string;

  @IsOptional()
  @IsBoolean()
  hideName?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(99)
  quantity?: number;
}

export class UpdateParticipationDto implements UpdateParticipationRequest {
  @IsOptional()
  @IsBoolean()
  received?: boolean;

  @IsOptional()
  @IsBoolean()
  thanked?: boolean;
}
