import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@org/backend-core';
import type { AdminItem, PublicItem, PublicItemDetail } from '@org/shared-contracts';
import {
  AdminItemsQueryDto,
  CreateItemDto,
  PublicItemsQueryDto,
  ReorderItemsDto,
  UpdateItemDto,
} from './dto/item.dto';
import { ItemService } from './item.service';

/** Unauthenticated: published items only. */
@ApiTags('items')
@Controller('public/items')
export class PublicItemsController {
  constructor(private readonly items: ItemService) {}

  @Get()
  list(@Query() query: PublicItemsQueryDto): Promise<PublicItem[]> {
    return this.items.listPublic(query);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<PublicItemDetail> {
    return this.items.getPublic(id);
  }
}

/** Parents' back-office. Restricted by the global `RolesGuard`. */
@ApiTags('items')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/items')
export class AdminItemsController {
  constructor(private readonly items: ItemService) {}

  @Get()
  list(@Query() query: AdminItemsQueryDto): Promise<AdminItem[]> {
    return this.items.listAdmin(query.publication, query.destination);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<AdminItem> {
    return this.items.getAdmin(id);
  }

  @Post()
  create(@Body() body: CreateItemDto): Promise<AdminItem> {
    return this.items.create(body);
  }

  @Post('reorder')
  @HttpCode(200)
  reorder(@Body() body: ReorderItemsDto): Promise<AdminItem[]> {
    return this.items.reorder(body.ids);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateItemDto): Promise<AdminItem> {
    return this.items.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): Promise<void> {
    return this.items.remove(id);
  }
}
