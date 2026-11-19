import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@org/backend-core';
import type { AdminListing } from '@org/shared-contracts';
import { CreateListingDto, UpdateListingDto } from './dto/listing.dto';
import { ListingService } from './listing.service';

/** Parents manage the ads attached to an item (PRODUCT F12, MVP: by hand). */
@ApiTags('listings')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminListingsController {
  constructor(private readonly listings: ListingService) {}

  @Get('items/:itemId/listings')
  list(@Param('itemId') itemId: string): Promise<AdminListing[]> {
    return this.listings.listForItem(itemId);
  }

  @Post('items/:itemId/listings')
  create(@Param('itemId') itemId: string, @Body() body: CreateListingDto): Promise<AdminListing> {
    return this.listings.create(itemId, body);
  }

  @Patch('listings/:id')
  update(@Param('id') id: string, @Body() body: UpdateListingDto): Promise<AdminListing> {
    return this.listings.update(id, body);
  }

  @Delete('listings/:id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.listings.remove(id);
  }
}
