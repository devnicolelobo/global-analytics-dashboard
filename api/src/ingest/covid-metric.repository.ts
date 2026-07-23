import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NormalizedMetricInput } from './normalized-metric.types';

export interface UpsertMetricsResult {
  /** Number of covid_daily_metrics upsert operations executed. */
  recordsUpserted: number;
  /** Distinct countries upserted in this batch. */
  countriesUpserted: number;
}

/** Metric rows per transaction — avoids Prisma interactive tx timeout on full sync. */
const METRIC_CHUNK_SIZE = 200;

const COUNTRY_TRANSACTION_TIMEOUT_MS = 60_000;
const METRIC_TRANSACTION_TIMEOUT_MS = 120_000;

/**
 * Prisma persistence for normalized COVID metrics.
 * Countries upsert first, then metrics in chunked transactions (all-or-nothing per chunk).
 * Ingest orders snapshot rows before series so map/KPI data commits before chart backfill.
 * @see docs/DATA_MODEL.md §5.1–5.2
 */
@Injectable()
export class CovidMetricRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upsert countries first (FK), then metrics on natural key
   * (countryCode, region, referenceDate). Cases/deaths fields merge on update.
   * Never deletes existing rows (REQ-F-05).
   */
  async upsertNormalizedMetrics(
    metrics: NormalizedMetricInput[],
  ): Promise<UpsertMetricsResult> {
    if (metrics.length === 0) {
      return { recordsUpserted: 0, countriesUpserted: 0 };
    }

    const countries = this.uniqueCountries(metrics);

    await this.prisma.$transaction(
      async (tx) => {
        for (const country of countries) {
          await tx.country.upsert({
            where: { iso2: country.iso2 },
            create: {
              iso2: country.iso2,
              name: country.name,
              upstreamName: country.upstreamName,
            },
            // Keep catalogue labels fresh if mapping changes later.
            update: {
              name: country.name,
              upstreamName: country.upstreamName,
            },
          });
        }
      },
      { timeout: COUNTRY_TRANSACTION_TIMEOUT_MS },
    );

    let recordsUpserted = 0;

    for (let offset = 0; offset < metrics.length; offset += METRIC_CHUNK_SIZE) {
      const chunk = metrics.slice(offset, offset + METRIC_CHUNK_SIZE);
      const chunkCount = await this.prisma.$transaction(
        async (tx) => {
          let count = 0;
          for (const metric of chunk) {
            await this.upsertMetric(tx, metric);
            count += 1;
          }
          return count;
        },
        { timeout: METRIC_TRANSACTION_TIMEOUT_MS },
      );
      recordsUpserted += chunkCount;
    }

    return {
      recordsUpserted,
      countriesUpserted: countries.length,
    };
  }

  private uniqueCountries(
    metrics: NormalizedMetricInput[],
  ): Array<{ iso2: string; name: string; upstreamName: string }> {
    const byIso2 = new Map<
      string,
      { iso2: string; name: string; upstreamName: string }
    >();

    for (const metric of metrics) {
      if (!byIso2.has(metric.countryCode)) {
        byIso2.set(metric.countryCode, {
          iso2: metric.countryCode,
          name: metric.countryName,
          upstreamName: metric.upstreamName,
        });
      }
    }

    return [...byIso2.values()];
  }

  private async upsertMetric(
    tx: Prisma.TransactionClient,
    metric: NormalizedMetricInput,
  ): Promise<void> {
    const referenceDate = this.toDateOnly(metric.referenceDate);
    const region = metric.region ?? '';
    const ingestedAt = new Date();

    const createData: Prisma.CovidDailyMetricCreateInput = {
      country: { connect: { iso2: metric.countryCode } },
      region,
      referenceDate,
      source: metric.source,
      ingestedAt,
      casesTotal: metric.casesTotal ?? null,
      casesNew: metric.casesNew ?? null,
      deathsTotal: metric.deathsTotal ?? null,
      deathsNew: metric.deathsNew ?? null,
    };

    // Merge only fields present on this pass — deaths call must not wipe cases.
    const updateData: Prisma.CovidDailyMetricUpdateInput = {
      source: metric.source,
      ingestedAt,
    };

    if (metric.casesTotal !== undefined) {
      updateData.casesTotal = metric.casesTotal;
    }
    if (metric.casesNew !== undefined) {
      updateData.casesNew = metric.casesNew;
    }
    if (metric.deathsTotal !== undefined) {
      updateData.deathsTotal = metric.deathsTotal;
    }
    if (metric.deathsNew !== undefined) {
      updateData.deathsNew = metric.deathsNew;
    }

    await tx.covidDailyMetric.upsert({
      where: {
        countryCode_region_referenceDate: {
          countryCode: metric.countryCode,
          region,
          referenceDate,
        },
      },
      create: createData,
      update: updateData,
    });
  }

  /** Parse YYYY-MM-DD to a UTC Date suitable for Prisma @db.Date. */
  private toDateOnly(isoDate: string): Date {
    return new Date(`${isoDate}T00:00:00.000Z`);
  }
}
