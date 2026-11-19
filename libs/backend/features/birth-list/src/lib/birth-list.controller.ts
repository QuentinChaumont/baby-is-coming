import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '@org/backend-core';
import type { AdminBirthList, PublicBirthList } from '@org/shared-contracts';
import { BirthListService } from './birth-list.service';
import { UpdateBirthListDto } from './dto/update-birth-list.dto';

/** Parents' settings for the list. Restricted by the global `RolesGuard`. */
@ApiTags('birth-list')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/list')
export class AdminBirthListController {
  constructor(private readonly service: BirthListService) {}

  @Get()
  get(): Promise<AdminBirthList> {
    return this.service.getAdmin();
  }

  @Patch()
  patch(@Body() body: UpdateBirthListDto): Promise<AdminBirthList> {
    return this.service.update(body);
  }
}

/** Unauthenticated guest view: only the whitelisted public fields. */
@ApiTags('birth-list')
@Controller('public/list')
export class PublicBirthListController {
  constructor(private readonly service: BirthListService) {}

  @Get()
  get(): Promise<PublicBirthList> {
    return this.service.getPublic();
  }
}
