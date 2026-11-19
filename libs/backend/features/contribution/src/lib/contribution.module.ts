import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BirthListModule } from '@org/backend-features-birth-list';
import { ParticipationModule } from '@org/backend-features-participation';
import { AdminContributionsController, PublicKittyController } from './contribution.controller';
import { Contribution, ContributionSchema } from './contribution.schema';
import { ContributionService } from './contribution.service';
import { GuestDataJob } from './guest-data.job';

/** The « J'ai la flemme » kitty (DEV 2.2) and the guests' data
 * anonymization job (DEV 5.1). */
@Module({
  imports: [
    BirthListModule,
    ParticipationModule,
    MongooseModule.forFeature([{ name: Contribution.name, schema: ContributionSchema }]),
  ],
  controllers: [PublicKittyController, AdminContributionsController],
  providers: [ContributionService, GuestDataJob],
  exports: [ContributionService, GuestDataJob],
})
export class ContributionModule {}
