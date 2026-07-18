import { Injectable } from '@nestjs/common';
import { SyncStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Metric row shape returned by Prisma selects used for roll-up. */
export interface MetricQueryRow {
  countryCode: string;
  region: string;
  referenceDate: Date;
  casesTotal: number | null;
  deathsTotal: number | null;
  casesNew: number | null;
  deathsNew: number | null;
}

const METRIC_SELECT = {
  countryCode: true,
  region: true,
  referenceDate: true,
  casesTotal: true,
  deathsTotal: true,
  casesNew: true,
  deathsNew: true,
} as const;

/**
 * Prisma-only COVID read queries (no HTTP / no aggregation).
 * Aggregation rules live in `aggregation.ts` and are applied by CovidService.
 */
@Injectable()
export class CovidQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /** Latest referenceDate across all metrics, or null when empty. */
  async findLatestReferenceDate(): Promise<Date | null> {
    const result = await this.prisma.covidDailyMetric.aggregate({
      _max: { referenceDate: true },
    });
    return result._max.referenceDate ?? null;
  }

  /** Completed-at of the most recent successful SyncRun, or null. */
  async findLastSuccessfulSyncAt(): Promise<Date | null> {
    const run = await this.prisma.syncRun.findFirst({
      where: { status: SyncStatus.success, completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      select: { completedAt: true },
    });
    return run?.completedAt ?? null;
  }

  /** Full country catalogue (ISO2 + name), ordered by name. */
  async findAllCountries(): Promise<Array<{ iso2: string; name: string }>> {
    return this.prisma.country.findMany({
      select: { iso2: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  /** Single country by ISO2, or null when unknown. */
  async findCountryByCode(
    countryCode: string,
  ): Promise<{ iso2: string; name: string } | null> {
    return this.prisma.country.findUnique({
      where: { iso2: countryCode },
      select: { iso2: true, name: true },
    });
  }

  /**
   * All metric rows for a single referenceDate (all countries / regions).
   * Caller applies country + global roll-up — never return raw regions in HTTP.
   */
  async findMetricsForDate(referenceDate: Date): Promise<MetricQueryRow[]> {
    return this.prisma.covidDailyMetric.findMany({
      where: { referenceDate },
      select: METRIC_SELECT,
    });
  }

  /** Metric rows for one country on one date (may include multiple regions). */
  async findMetricsForCountryOnDate(
    countryCode: string,
    referenceDate: Date,
  ): Promise<MetricQueryRow[]> {
    return this.prisma.covidDailyMetric.findMany({
      where: { countryCode, referenceDate },
      select: METRIC_SELECT,
    });
  }

  /**
   * Latest referenceDate that has any row for the given country, or null.
   */
  async findLatestReferenceDateForCountry(
    countryCode: string,
  ): Promise<Date | null> {
    const result = await this.prisma.covidDailyMetric.aggregate({
      where: { countryCode },
      _max: { referenceDate: true },
    });
    return result._max.referenceDate ?? null;
  }

  /**
   * True when the country has more than one distinct region value stored
   * (API_SPEC §6.4 `meta.hasRegionalBreakdown`).
   */
  async hasRegionalBreakdown(countryCode: string): Promise<boolean> {
    const regions = await this.prisma.covidDailyMetric.findMany({
      where: { countryCode },
      distinct: ['region'],
      select: { region: true },
    });
    return regions.length > 1;
  }

  /**
   * Time-series rows filtered in DB by optional date range, ordered ASC.
   * When `countryCode` is omitted → global series input (all countries).
   */
  async findSeriesRows(options: {
    countryCode?: string;
    from?: string;
    to?: string;
  }): Promise<MetricQueryRow[]> {
    const referenceDateFilter: {
      gte?: Date;
      lte?: Date;
    } = {};

    if (options.from) {
      referenceDateFilter.gte = new Date(`${options.from}T00:00:00.000Z`);
    }
    if (options.to) {
      referenceDateFilter.lte = new Date(`${options.to}T00:00:00.000Z`);
    }

    return this.prisma.covidDailyMetric.findMany({
      where: {
        ...(options.countryCode
          ? { countryCode: options.countryCode }
          : {}),
        ...(Object.keys(referenceDateFilter).length > 0
          ? { referenceDate: referenceDateFilter }
          : {}),
      },
      select: METRIC_SELECT,
      orderBy: { referenceDate: 'asc' },
    });
  }
}
