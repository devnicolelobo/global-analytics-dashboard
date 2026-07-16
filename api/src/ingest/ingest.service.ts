import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, SyncStatus } from '@prisma/client';
import { SyncAlreadyRunningException } from '../common/errors';
import {
  COVID_UPSTREAM_CLIENT,
  type CovidUpstreamClient,
} from '../integration/api-ninjas/covid-upstream.client';
import { UpstreamError } from '../integration/api-ninjas/api-ninjas.errors';
import { ApiNinjasDateSnapshotRow } from '../integration/api-ninjas/api-ninjas.types';
import { PrismaService } from '../prisma/prisma.service';
import { CovidMetricRepository } from './covid-metric.repository';
import { MetricNormalizer } from './metric-normalizer';
import { NormalizedMetricInput } from './normalized-metric.types';
import { redactSensitiveText } from '../common/security/redact-sensitive';

/** Sync modes accepted by POST /sync (API_SPEC §7.1). */
export type SyncMode = 'snapshot' | 'country-series' | 'full';

export const SYNC_MODES: readonly SyncMode[] = [
  'snapshot',
  'country-series',
  'full',
] as const;

/**
 * Latest archive date observed for API Ninjas COVID data (EXTERNAL_APIS §3.5).
 * Used as the default snapshot `date` param until a fresher probe exists.
 */
export const DEFAULT_SNAPSHOT_DATE = '2023-03-09';

/**
 * Prioritized upstream country names for series backfill (EXTERNAL_APIS §5).
 * Keeps MVP call volume bounded — not the full catalogue.
 */
const PRIORITY_SERIES_COUNTRIES: readonly string[] = [
  'Brazil',
  'United States',
  'Canada',
  'United Kingdom',
  'Germany',
  'France',
  'Italy',
  'Spain',
  'India',
  'Japan',
  'Mexico',
  'Argentina',
] as const;

/** Immediate result of starting a sync — maps to HTTP 202 body. */
export interface SyncAcceptedResult {
  syncRunId: string;
  status: 'running';
  startedAt: Date;
  mode: SyncMode;
}

/**
 * Orchestrates SyncRun lifecycle + upstream fetch → normalize → upsert.
 * Controllers call `runSync` (fire-and-forget). Tests/schedulers may use `runSyncBlocking`.
 */
@Injectable()
export class IngestService {
  private readonly logger = new Logger(IngestService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalizer: MetricNormalizer,
    private readonly metrics: CovidMetricRepository,
    @Inject(COVID_UPSTREAM_CLIENT)
    private readonly upstream: CovidUpstreamClient,
  ) {}

  /**
   * Starts a sync and returns immediately (HTTP 202 pattern).
   * Ingest continues in the background; failures update SyncRun → failed (REQ-F-05).
   */
  async runSync(mode: SyncMode = 'full'): Promise<SyncAcceptedResult> {
    const accepted = await this.createRunningSync(mode);
    void this.performIngest(accepted.syncRunId, mode).catch(
      (error: unknown) => {
        this.logger.error(
          `Unhandled background sync failure for ${accepted.syncRunId}`,
          error instanceof Error ? error.stack : undefined,
        );
      },
    );
    return accepted;
  }

  /**
   * Starts a sync and awaits completion — for unit tests and future cron jobs.
   */
  async runSyncBlocking(mode: SyncMode = 'full'): Promise<SyncAcceptedResult> {
    const accepted = await this.createRunningSync(mode);
    await this.performIngest(accepted.syncRunId, mode);
    return accepted;
  }

  private async createRunningSync(mode: SyncMode): Promise<SyncAcceptedResult> {
    // App-level lock (MVP): check-then-insert. Multi-instance races are accepted;
    // harden later with a partial unique index or advisory lock if needed.
    const running = await this.prisma.syncRun.findFirst({
      where: { status: SyncStatus.running },
      select: { id: true },
    });
    if (running) {
      throw new SyncAlreadyRunningException();
    }

    const run = await this.prisma.syncRun.create({
      data: {
        mode,
        status: SyncStatus.running,
        source: 'api-ninjas',
      },
    });

    this.logger.log(`Sync started syncRunId=${run.id} mode=${mode}`);

    return {
      syncRunId: run.id,
      status: 'running',
      startedAt: run.startedAt,
      mode,
    };
  }

  private async performIngest(
    syncRunId: string,
    mode: SyncMode,
  ): Promise<void> {
    try {
      const { metrics, metadata } = await this.collectMetrics(mode);
      const result = await this.metrics.upsertNormalizedMetrics(metrics);

      await this.prisma.syncRun.update({
        where: { id: syncRunId },
        data: {
          status: SyncStatus.success,
          completedAt: new Date(),
          recordsUpserted: result.recordsUpserted,
          metadata: metadata as Prisma.InputJsonValue,
          errorMessage: null,
        },
      });

      this.logger.log(
        `Sync completed syncRunId=${syncRunId} recordsUpserted=${result.recordsUpserted}`,
      );
    } catch (error: unknown) {
      const safeMessage = sanitizeIngestErrorMessage(error);
      this.logger.warn(`Sync failed syncRunId=${syncRunId}: ${safeMessage}`);

      await this.markFailed(syncRunId, safeMessage);
    }
  }

  private async collectMetrics(mode: SyncMode): Promise<{
    metrics: NormalizedMetricInput[];
    metadata: Record<string, unknown>;
  }> {
    const metrics: NormalizedMetricInput[] = [];
    const metadata: Record<string, unknown> = {};

    if (mode === 'snapshot' || mode === 'full') {
      const snapshot = await this.ingestSnapshot(DEFAULT_SNAPSHOT_DATE);
      metrics.push(...snapshot.metrics);
      metadata.dateParam = DEFAULT_SNAPSHOT_DATE;
      metadata.snapshotSkippedUnmapped = snapshot.skippedUnmappedCountries;
    }

    if (mode === 'country-series' || mode === 'full') {
      const series = await this.ingestCountrySeries();
      metrics.push(...series.metrics);
      metadata.seriesCountries = series.countriesAttempted;
      metadata.seriesSkippedUnmapped = series.skippedUnmappedCountries;
    }

    return { metrics, metadata };
  }

  private async ingestSnapshot(dateParam: string): Promise<{
    metrics: NormalizedMetricInput[];
    skippedUnmappedCountries: string[];
  }> {
    const [casesRows, deathsRows] = await Promise.all([
      this.upstream.fetchByDate(dateParam, { type: 'cases' }),
      this.upstream.fetchByDate(dateParam, { type: 'deaths' }),
    ]);

    // Merge cases + deaths rows by country|region before normalize (G-06).
    const merged = mergeSnapshotRows(casesRows, deathsRows);
    const batch = this.normalizer.normalizeSnapshot(merged, dateParam);
    return {
      metrics: batch.metrics,
      skippedUnmappedCountries: batch.skippedUnmappedCountries,
    };
  }

  private async ingestCountrySeries(): Promise<{
    metrics: NormalizedMetricInput[];
    skippedUnmappedCountries: string[];
    countriesAttempted: string[];
  }> {
    const allMetrics: NormalizedMetricInput[] = [];
    const skippedUnmapped = new Set<string>();
    const countriesAttempted: string[] = [];

    for (const country of PRIORITY_SERIES_COUNTRIES) {
      countriesAttempted.push(country);
      const [casesRows, deathsRows] = await Promise.all([
        this.upstream.fetchByCountry(country, { type: 'cases' }),
        this.upstream.fetchByCountry(country, { type: 'deaths' }),
      ]);
      const rows = [...casesRows, ...deathsRows];
      const batch = this.normalizer.normalizeSeries(rows);
      allMetrics.push(...batch.metrics);
      for (const name of batch.skippedUnmappedCountries) {
        skippedUnmapped.add(name);
      }
    }

    return {
      metrics: allMetrics,
      skippedUnmappedCountries: [...skippedUnmapped],
      countriesAttempted,
    };
  }

  private async markFailed(
    syncRunId: string,
    errorMessage: string,
  ): Promise<void> {
    try {
      await this.prisma.syncRun.update({
        where: { id: syncRunId },
        data: {
          status: SyncStatus.failed,
          completedAt: new Date(),
          errorMessage,
        },
      });
    } catch (updateError: unknown) {
      this.logger.error(
        `Failed to mark SyncRun ${syncRunId} as failed`,
        updateError instanceof Error ? updateError.stack : undefined,
      );
    }
  }
}

/** Exported for tests — strip secrets from SyncRun.errorMessage (REQ-F-13). */
export function sanitizeIngestErrorMessage(error: unknown): string {
  const message =
    error instanceof UpstreamError || error instanceof Error
      ? error.message
      : 'Unknown ingest error';
  return redactSensitiveText(message);
}

export { redactSensitiveText } from '../common/security/redact-sensitive';

function mergeSnapshotRows(
  casesRows: ApiNinjasDateSnapshotRow[],
  deathsRows: ApiNinjasDateSnapshotRow[],
): ApiNinjasDateSnapshotRow[] {
  const byKey = new Map<string, ApiNinjasDateSnapshotRow>();

  for (const row of casesRows) {
    const key = `${row.country}|${row.region}`;
    byKey.set(key, {
      country: row.country,
      region: row.region,
      cases: row.cases,
    });
  }

  for (const row of deathsRows) {
    const key = `${row.country}|${row.region}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.deaths = row.deaths;
    } else {
      byKey.set(key, {
        country: row.country,
        region: row.region,
        deaths: row.deaths,
      });
    }
  }

  return [...byKey.values()];
}

/** Type guard helper for SyncMode validation (DTO layer). */
export function isSyncMode(value: unknown): value is SyncMode {
  return (
    typeof value === 'string' &&
    (SYNC_MODES as readonly string[]).includes(value)
  );
}
