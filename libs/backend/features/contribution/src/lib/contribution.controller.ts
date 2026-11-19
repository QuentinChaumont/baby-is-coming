import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Roles } from '@org/backend-core';
import type { AdminContribution, PublicKitty } from '@org/shared-contracts';
import { PledgeDto, UpdateContributionDto } from './dto/contribution.dto';
import { ContributionService } from './contribution.service';

/** Guests: the kitty summary and the pledge form (no account). */
@ApiTags('kitty')
@Controller('public')
export class PublicKittyController {
  constructor(private readonly contributions: ContributionService) {}

  @Get('kitty')
  kitty(): Promise<PublicKitty> {
    return this.contributions.kitty();
  }

  @Post('contributions')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async pledge(@Body() body: PledgeDto): Promise<PublicKitty> {
    // Honeypot filled ⇒ a bot: answer as usual, store nothing.
    if (body.website) return this.contributions.kitty();
    return this.contributions.pledge(body);
  }
}

/** Parents: pledges with amounts, « reçu » / « merci envoyé », cancel. */
@ApiTags('kitty')
@ApiBearerAuth()
@Roles('admin')
@Controller('admin/contributions')
export class AdminContributionsController {
  constructor(private readonly contributions: ContributionService) {}

  @Get()
  list(): Promise<AdminContribution[]> {
    return this.contributions.list();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateContributionDto): Promise<AdminContribution> {
    return this.contributions.update(id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  cancel(@Param('id') id: string): Promise<void> {
    return this.contributions.cancel(id);
  }
}
