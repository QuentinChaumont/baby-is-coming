import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  ITEM_DESTINATIONS,
  ITEM_PUBLICATIONS,
  type CreateItemRequest,
  type ItemDestination,
  type ItemPublication,
  type ItemSort,
  type PublicItemsQuery,
  type ReorderItemsRequest,
  type UpdateItemRequest,
} from '@org/shared-contracts';

const MAX_PRICE = 100_000;
const MAX_QUANTITY = 99;

export class PublicItemsQueryDto implements PublicItemsQuery {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true' || value === '1')
  @IsBoolean()
  showTaken?: boolean;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc'])
  sort?: ItemSort;

  @IsOptional()
  @IsIn(ITEM_DESTINATIONS)
  destination?: ItemDestination;
}

export class AdminItemsQueryDto {
  @IsOptional()
  @IsIn(ITEM_PUBLICATIONS)
  publication?: ItemPublication;

  @IsOptional()
  @IsIn(ITEM_DESTINATIONS)
  destination?: ItemDestination;
}

export class CreateItemDto implements CreateItemRequest {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  price?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  priceMax?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity?: number;

  @IsOptional()
  @IsIn(ITEM_DESTINATIONS)
  destination?: ItemDestination;
}

export class UpdateItemDto implements UpdateItemRequest {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  price?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(MAX_PRICE)
  priceMax?: number | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_QUANTITY)
  quantity?: number;

  @IsOptional()
  @IsIn(ITEM_PUBLICATIONS)
  publication?: ItemPublication;

  @IsOptional()
  @IsIn(ITEM_DESTINATIONS)
  destination?: ItemDestination;

  @IsOptional()
  @IsBoolean()
  bought?: boolean;
}

export class ReorderItemsDto implements ReorderItemsRequest {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @IsMongoId({ each: true })
  ids!: string[];
}
