import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ItemModule } from '@org/backend-features-item';
import {
  AdminParticipationsController,
  PublicParticipationsController,
} from './participation.controller';
import { Participation, ParticipationSchema } from './participation.schema';
import { ParticipationService } from './participation.service';

/** Taking gifts: chasse / don by guests, assignments by the parents
 * (DEV step 2.1). */
@Module({
  imports: [
    ItemModule,
    MongooseModule.forFeature([{ name: Participation.name, schema: ParticipationSchema }]),
  ],
  controllers: [PublicParticipationsController, AdminParticipationsController],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class ParticipationModule {}
