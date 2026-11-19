import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BirthListModule } from '@org/backend-features-birth-list';
import { AdminContributionsController, PublicKittyController } from './contribution.controller';
import { Contribution, ContributionSchema } from './contribution.schema';
import { ContributionService } from './contribution.service';

/** The « J'ai la flemme » kitty: pledges (DEV step 2.2). */
@Module({
  imports: [
    BirthListModule,
    MongooseModule.forFeature([{ name: Contribution.name, schema: ContributionSchema }]),
  ],
  controllers: [PublicKittyController, AdminContributionsController],
  providers: [ContributionService],
  exports: [ContributionService],
})
export class ContributionModule {}
