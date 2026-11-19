import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  LISTING_STATUSES,
  type CreateListingRequest,
  type ListingStatus,
  type UpdateListingRequest,
} from '@org/shared-contracts';

const HTTPS_URL = { protocols: ['https'], require_protocol: true };

export class CreateListingDto implements CreateListingRequest {
  @IsUrl(HTTPS_URL)
  @MaxLength(1000)
  url!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @IsUrl(HTTPS_URL)
  @MaxLength(1000)
  imageUrl?: string | null;
}

export class UpdateListingDto implements UpdateListingRequest {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000)
  price?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string | null;

  @IsOptional()
  @IsUrl(HTTPS_URL)
  @MaxLength(1000)
  imageUrl?: string | null;

  @IsOptional()
  @IsIn(LISTING_STATUSES)
  status?: ListingStatus;
}
