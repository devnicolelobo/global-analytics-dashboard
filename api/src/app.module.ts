import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';
import { HealthModule } from './health/health.module';
import { IngestModule } from './ingest/ingest.module';
import { ApiNinjasModule } from './integration/api-ninjas/api-ninjas.module';
import { PrismaModule } from './prisma/prisma.module';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    // isGlobal: true — ConfigService available in every module without re-importing.
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    HealthModule,
    // Upstream HTTP client for COVID-19 data (used by the ingest pipeline).
    ApiNinjasModule,
    // Normalization + Prisma persistence for COVID metrics.
    IngestModule,
    // Operator sync HTTP endpoints (API_SPEC §7).
    SyncModule,
  ],
})
export class AppModule {}
