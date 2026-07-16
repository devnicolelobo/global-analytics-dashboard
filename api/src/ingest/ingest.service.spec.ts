import { SyncStatus } from '@prisma/client';
import { SyncAlreadyRunningException } from '../common/errors';
import { UpstreamUnavailableError } from '../integration/api-ninjas/api-ninjas.errors';
import { PrismaService } from '../prisma/prisma.service';
import { CovidMetricRepository } from './covid-metric.repository';
import {
  DEFAULT_SNAPSHOT_DATE,
  IngestService,
  redactSensitiveText,
  sanitizeIngestErrorMessage,
} from './ingest.service';
import { MetricNormalizer } from './metric-normalizer';

function firstCallArg<T>(mock: jest.Mock): T {
  const args = mock.mock.calls[0] as unknown[] | undefined;
  if (!args?.[0] || typeof args[0] !== 'object') {
    throw new Error('Expected mock to be called with an object');
  }
  return args[0] as T;
}

describe('IngestService', () => {
  let findFirst: jest.Mock;
  let create: jest.Mock;
  let update: jest.Mock;
  let normalizeSnapshot: jest.Mock;
  let normalizeSeries: jest.Mock;
  let upsertNormalizedMetrics: jest.Mock;
  let fetchByDate: jest.Mock;
  let fetchByCountry: jest.Mock;
  let service: IngestService;

  beforeEach(() => {
    findFirst = jest.fn().mockResolvedValue(null);
    create = jest.fn().mockResolvedValue({
      id: 'run_1',
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      status: SyncStatus.running,
      mode: 'snapshot',
    });
    update = jest.fn().mockResolvedValue({});
    normalizeSnapshot = jest.fn();
    normalizeSeries = jest.fn();
    upsertNormalizedMetrics = jest.fn();
    fetchByDate = jest.fn();
    fetchByCountry = jest.fn();

    const prisma = {
      syncRun: { findFirst, create, update },
    } as unknown as PrismaService;

    const normalizer = {
      normalizeSnapshot,
      normalizeSeries,
    } as unknown as MetricNormalizer;

    const metrics = {
      upsertNormalizedMetrics,
    } as unknown as CovidMetricRepository;

    service = new IngestService(prisma, normalizer, metrics, {
      fetchByDate,
      fetchByCountry,
    });
  });

  it('throws SyncAlreadyRunningException when a run is already running', async () => {
    findFirst.mockResolvedValue({ id: 'busy' });

    await expect(service.runSyncBlocking('snapshot')).rejects.toBeInstanceOf(
      SyncAlreadyRunningException,
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('snapshot mode fetches cases+deaths, upserts, and marks success', async () => {
    fetchByDate
      .mockResolvedValueOnce([
        {
          country: 'Brazil',
          region: '',
          cases: { total: 10, new: 1 },
        },
      ])
      .mockResolvedValueOnce([
        {
          country: 'Brazil',
          region: '',
          deaths: { total: 2, new: 0 },
        },
      ]);

    normalizeSnapshot.mockReturnValue({
      metrics: [
        {
          countryCode: 'BR',
          countryName: 'Brazil',
          upstreamName: 'Brazil',
          region: '',
          referenceDate: DEFAULT_SNAPSHOT_DATE,
          source: 'api-ninjas',
          casesTotal: 10,
          deathsTotal: 2,
        },
      ],
      skippedUnmappedCountries: [],
      skippedInvalidDates: 0,
    });

    upsertNormalizedMetrics.mockResolvedValue({
      recordsUpserted: 1,
      countriesUpserted: 1,
    });

    const accepted = await service.runSyncBlocking('snapshot');

    expect(accepted).toEqual({
      syncRunId: 'run_1',
      status: 'running',
      startedAt: new Date('2026-07-08T18:30:00.000Z'),
      mode: 'snapshot',
    });

    expect(fetchByDate).toHaveBeenCalledWith(DEFAULT_SNAPSHOT_DATE, {
      type: 'cases',
    });
    expect(fetchByDate).toHaveBeenCalledWith(DEFAULT_SNAPSHOT_DATE, {
      type: 'deaths',
    });
    expect(upsertNormalizedMetrics).toHaveBeenCalled();

    const updateArg = firstCallArg<{
      where: { id: string };
      data: {
        status: SyncStatus;
        recordsUpserted: number;
        errorMessage: null;
        metadata: { dateParam: string };
      };
    }>(update);
    expect(updateArg.where.id).toBe('run_1');
    expect(updateArg.data.status).toBe(SyncStatus.success);
    expect(updateArg.data.recordsUpserted).toBe(1);
    expect(updateArg.data.errorMessage).toBeNull();
    expect(updateArg.data.metadata.dateParam).toBe(DEFAULT_SNAPSHOT_DATE);
  });

  it('marks SyncRun failed without wiping metrics when upstream fails', async () => {
    fetchByDate.mockRejectedValue(new UpstreamUnavailableError('upstream 503'));

    const accepted = await service.runSyncBlocking('snapshot');

    expect(accepted.syncRunId).toBe('run_1');
    expect(upsertNormalizedMetrics).not.toHaveBeenCalled();

    const updateArg = firstCallArg<{
      data: { status: SyncStatus; errorMessage: string };
    }>(update);
    expect(updateArg.data.status).toBe(SyncStatus.failed);
    expect(updateArg.data.errorMessage).toContain('upstream 503');
  });

  it('runSync returns before ingest finishes (fire-and-forget)', async () => {
    let resolveFetch!: () => void;
    const fetchGate = new Promise<void>((resolve) => {
      resolveFetch = resolve;
    });

    fetchByDate.mockImplementation(async () => {
      await fetchGate;
      return [];
    });
    normalizeSnapshot.mockReturnValue({
      metrics: [],
      skippedUnmappedCountries: [],
      skippedInvalidDates: 0,
    });
    upsertNormalizedMetrics.mockResolvedValue({
      recordsUpserted: 0,
      countriesUpserted: 0,
    });

    const accepted = await service.runSync('snapshot');
    expect(accepted.syncRunId).toBe('run_1');
    expect(update).not.toHaveBeenCalled();

    resolveFetch();
    await new Promise((r) => setImmediate(r));
    await new Promise((r) => setImmediate(r));

    expect(update).toHaveBeenCalled();
  });
});

describe('sanitizeIngestErrorMessage', () => {
  it('redacts connection strings and API keys', () => {
    const message = sanitizeIngestErrorMessage(
      new Error(
        'fail postgresql://gad:secret@db/x with API_NINJAS_KEY=abc123 Bearer tok',
      ),
    );
    expect(message).not.toContain('secret');
    expect(message).not.toContain('abc123');
    expect(message).toContain('postgresql://***');
    expect(message).toContain('API_NINJAS_KEY=***');
  });
});

describe('redactSensitiveText', () => {
  it('redacts secrets from stored SyncRun error strings', () => {
    const message = redactSensitiveText(
      'upstream fail postgresql://gad:secret@db/x',
    );
    expect(message).not.toContain('secret');
    expect(message).toContain('postgresql://***');
  });
});
