import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@org/backend-core';
import type { AdminParticipation, PublicItem } from '@org/shared-contracts';
import { AssignItemDto, TakeItemDto, UpdateParticipationDto } from './dto/participation.dto';
import { ParticipationService } from './participation.service';

/** A guest takes a gift — no account (PRODUCT P1). Spam is kept out by a
 * stricter rate limit and a honeypot field, never a visible captcha. */
@ApiTags('participations')
@Controller('public/items/:itemId/take')
export class PublicParticipationsController {
  constructor(private readonly participations: ParticipationService) {}

  @Post()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async take(@Param('itemId') itemId: string, @Body() body: TakeItemDto): Promise<PublicItem | void> {
    // Honeypot filled ⇒ a bot: pretend it worked, store nothing.
    if (body.website) return;
    return this.participations.take(itemId, body);
  }
}

/** Parents' follow-up of who took what (PRODUCT F8). */
@ApiTags('participations')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin')
export class AdminParticipationsController {
  constructor(private readonly participations: ParticipationService) {}

  @Get('participations')
  list(): Promise<AdminParticipation[]> {
    return this.participations.list();
  }

  @Post('items/:itemId/participations')
  assign(@Param('itemId') itemId: string, @Body() body: AssignItemDto): Promise<AdminParticipation> {
    return this.participations.assign(itemId, body);
  }

  @Patch('participations/:id')
  update(@Param('id') id: string, @Body() body: UpdateParticipationDto): Promise<AdminParticipation> {
    return this.participations.update(id, body);
  }

  @Delete('participations/:id')
  @HttpCode(204)
  cancel(@Param('id') id: string): Promise<void> {
    return this.participations.cancel(id);
  }
}
