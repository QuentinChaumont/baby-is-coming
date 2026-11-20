import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BirthListModule } from '@org/backend-features-birth-list';
import { ItemModule } from '@org/backend-features-item';
import { ParticipationModule } from '@org/backend-features-participation';
import {
  AdminContributionsController,
  PublicKittyController,
} from './contribution.controller';
import { Contribution, ContributionSchema } from './contribution.schema';
import { ContributionService } from './contribution.service';
import { GuestDataJob } from './guest-data.job';
import {
  AdminHallOfFameController,
  HallOfFame,
  HallOfFameSchema,
  HallOfFameService,
  PublicHallOfFameController,
} from './hall-of-fame';

/** The « J'ai la flemme » kitty (DEV 2.2), the guests' data
 * anonymization job (DEV 5.1) and the hall of fame of Kiki's notebook. */
@Module({
  imports: [
    BirthListModule,
    ItemModule,
    ParticipationModule,
    MongooseModule.forFeature([
      { name: Contribution.name, schema: ContributionSchema },
      { name: HallOfFame.name, schema: HallOfFameSchema },
    ]),
  ],
  controllers: [
    PublicKittyController,
    AdminContributionsController,
    PublicHallOfFameController,
    AdminHallOfFameController,
  ],
  providers: [ContributionService, GuestDataJob, HallOfFameService],
  exports: [ContributionService, GuestDataJob],
})
export class ContributionModule {}
