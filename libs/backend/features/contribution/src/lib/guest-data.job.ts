import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BirthListService } from '@org/backend-features-birth-list';
import { ParticipationService } from '@org/backend-features-participation';
import { ContributionService } from './contribution.service';

/** Today as `YYYY-MM-DD` (UTC). */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Daily: once the anonymization date is reached (explicit date, else due
 * date + 6 months — PRODUCT D13 / R-RGPD-3), wipes guests' names and
 * messages from participations and pledges. Items, counts and totals stay.
 */
@Injectable()
export class GuestDataJob {
  private readonly logger = new Logger(GuestDataJob.name);

  constructor(
    private readonly birthList: BirthListService,
    private readonly participations: ParticipationService,
    private readonly contributions: ContributionService,
  ) {}

  @Cron('0 4 * * *', { name: 'guest-data-anonymization' })
  async run(now: string = today()): Promise<{ participations: number; contributions: number } | null> {
    const { effectiveAnonymizeAt } = await this.birthList.getAdmin();
    if (!effectiveAnonymizeAt || now < effectiveAnonymizeAt) return null;
    const result = {
      participations: await this.participations.anonymizeAll(),
      contributions: await this.contributions.anonymizeAll(),
    };
    if (result.participations || result.contributions) {
      this.logger.log(
        `Anonymized ${result.participations} participation(s) and ${result.contributions} pledge(s)`,
      );
    }
    return result;
  }
}
