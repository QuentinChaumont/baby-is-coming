import { IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import type { PledgeRequest, UpdateContributionRequest } from '@org/shared-contracts';

export class PledgeDto implements PledgeRequest {
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

  /** Whole euros; no minimum beyond « more than nothing » (PRODUCT D7). */
  @IsInt()
  @Min(1)
  @Max(100_000)
  amount!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;
}

export class UpdateContributionDto implements UpdateContributionRequest {
  @IsOptional()
  @IsBoolean()
  received?: boolean;

  @IsOptional()
  @IsBoolean()
  thanked?: boolean;
}
