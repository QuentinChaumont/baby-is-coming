import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import {
  AppConfigModule,
  AppHttpModule,
  AppSecurityModule,
  HealthModule,
  LoggerModule,
} from '@org/backend-core';
import { AuthModule } from '@org/backend-auth';
import { AuthResetModule } from '@org/backend-auth-reset';
import { MongoModule } from '@org/backend-database-mongo';
import { MailerModule } from '@org/backend-mailer';
import { AccountRetentionModule } from '@org/backend-features-account-retention';
import { AppSettingsModule } from '@org/backend-features-app-settings';
import { AuditModule } from '@org/backend-features-audit';
import { BirthListModule } from '@org/backend-features-birth-list';
import { ItemModule } from '@org/backend-features-item';
import { ParticipationModule } from '@org/backend-features-participation';
import { RoleModule } from '@org/backend-features-role';
import { UserModule } from '@org/backend-features-user';

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    AppHttpModule,
    AppSecurityModule,
    HealthModule,
    ScheduleModule.forRoot(),
    MongoModule,
    MailerModule,
    UserModule,
    AppSettingsModule,
    RoleModule,
    AuthModule,
    AuthResetModule,
    AuditModule,
    AccountRetentionModule,
    BirthListModule,
    ItemModule,
    ParticipationModule,
  ],
})
export class AppModule {}
