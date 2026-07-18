import { Module } from '@nestjs/common';
import { ApiNinjasModule } from '../integration/api-ninjas/api-ninjas.module';
import { CovidMetricRepository } from './covid-metric.repository';
import { IngestService } from './ingest.service';
import { MetricNormalizer } from './metric-normalizer';

/**
 * COVID ingest pipeline: normalize + upsert + SyncRun orchestration.
 * PrismaService comes from the global PrismaModule.
 * SyncModule (HTTP) imports this module and injects IngestService.
 */
@Module({
  imports: [ApiNinjasModule],
  providers: [MetricNormalizer, CovidMetricRepository, IngestService],
  exports: [MetricNormalizer, CovidMetricRepository, IngestService],
})
export class IngestModule {}
