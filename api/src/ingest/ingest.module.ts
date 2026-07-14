import { Module } from '@nestjs/common';
import { CovidMetricRepository } from './covid-metric.repository';
import { MetricNormalizer } from './metric-normalizer';

/**
 * Groups COVID metric normalization and Prisma persistence for the ingest pipeline.
 * PrismaService is provided by the global PrismaModule.
 * Downstream ingest orchestration should import this module and inject the exported providers.
 */
@Module({
  providers: [MetricNormalizer, CovidMetricRepository],
  exports: [MetricNormalizer, CovidMetricRepository],
})
export class IngestModule {}
