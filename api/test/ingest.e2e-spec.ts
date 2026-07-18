import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ErrorResponseDto } from '../src/common/errors/error-response.dto';
import { DEFAULT_SNAPSHOT_DATE } from '../src/ingest/ingest.service';
import { IngestService } from '../src/ingest/ingest.service';
import { UpstreamUnavailableError } from '../src/integration/api-ninjas/api-ninjas.errors';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  createTestApp,
  DEFAULT_TEST_DATABASE_URL,
  FIXTURE_REF_DATE,
  isDatabaseReachable,
  seedCovidFixtures,
  truncateAllTables,
} from './helpers';

/**
 * Ingest / SyncRun e2e with mocked COVID_UPSTREAM_CLIENT (DEV-87).
 * Never calls live API Ninjas — CI-safe.
 */
describe('Ingest path (integration e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ingest: IngestService;
  let dbReady = false;
  let fetchByDate: jest.Mock;
  let fetchByCountry: jest.Mock;

  beforeAll(async () => {
    dbReady = await isDatabaseReachable(DEFAULT_TEST_DATABASE_URL);
    if (!dbReady) {
      console.warn(
        'Skipping ingest integration e2e: PostgreSQL unreachable (docker compose up -d)',
      );
      return;
    }

    fetchByDate = jest.fn();
    fetchByCountry = jest.fn().mockResolvedValue([]);

    const boot = await createTestApp({
      upstream: { fetchByDate, fetchByCountry },
    });
    app = boot.app;
    prisma = boot.moduleRef.get(PrismaService);
    ingest = boot.moduleRef.get(IngestService);
  });

  beforeEach(async () => {
    if (!dbReady) {
      return;
    }
    await truncateAllTables(prisma);
    await seedCovidFixtures(prisma);

    fetchByDate.mockReset();
    fetchByCountry.mockReset();
    fetchByCountry.mockResolvedValue([]);
    // cases + deaths calls in parallel for snapshot mode
    fetchByDate.mockResolvedValue([
      {
        country: 'Brazil',
        region: '',
        cases: { total: 555, new: 2 },
        deaths: { total: 7, new: 0 },
      },
    ]);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('happy path: snapshot ingest upserts metrics and marks SyncRun success', async () => {
    if (!dbReady) {
      return;
    }

    await ingest.runSyncBlocking('snapshot');

    const run = await prisma.syncRun.findFirst({
      where: { mode: 'snapshot' },
      orderBy: { startedAt: 'desc' },
    });
    expect(run?.status).toBe('success');
    expect(run?.recordsUpserted).toBeGreaterThan(0);
    expect(run?.errorMessage).toBeNull();

    const br = await prisma.covidDailyMetric.findFirst({
      where: {
        countryCode: 'BR',
        region: '',
        referenceDate: new Date(`${DEFAULT_SNAPSHOT_DATE}T00:00:00.000Z`),
      },
    });
    expect(br?.casesTotal).toBe(555);
    expect(br?.deathsTotal).toBe(7);

    // Upstream called for cases + deaths (parallel) — never a real HTTP client
    expect(fetchByDate).toHaveBeenCalled();
    expect(fetchByCountry).not.toHaveBeenCalled();
  });

  it('upstream failure: SyncRun failed and prior metrics unchanged (REQ-F-05)', async () => {
    if (!dbReady) {
      return;
    }

    const beforeCount = await prisma.covidDailyMetric.count();
    const beforeBr = await prisma.covidDailyMetric.findFirst({
      where: {
        countryCode: 'BR',
        region: '',
        referenceDate: new Date(`${FIXTURE_REF_DATE}T00:00:00.000Z`),
      },
    });
    expect(beforeBr?.casesTotal).toBe(100);

    fetchByDate.mockRejectedValue(
      new UpstreamUnavailableError('simulated upstream outage'),
    );

    await ingest.runSyncBlocking('snapshot');

    expect(await prisma.covidDailyMetric.count()).toBe(beforeCount);
    const afterBr = await prisma.covidDailyMetric.findFirst({
      where: {
        countryCode: 'BR',
        region: '',
        referenceDate: new Date(`${FIXTURE_REF_DATE}T00:00:00.000Z`),
      },
    });
    expect(afterBr?.casesTotal).toBe(100);

    const run = await prisma.syncRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });
    expect(run?.status).toBe('failed');
    expect(run?.errorMessage).toBeTruthy();
    expect(run?.errorMessage).not.toContain('API_NINJAS_KEY');
    expect(run?.errorMessage).not.toMatch(/postgresql:\/\//i);
  });

  it('POST /sync concurrent → 409 when a SyncRun is already running', async () => {
    if (!dbReady) {
      return;
    }

    await prisma.syncRun.create({
      data: {
        status: 'running',
        mode: 'full',
        source: 'api-ninjas',
      },
    });

    const response = await request(app.getHttpServer())
      .post('/sync')
      .send({ mode: 'snapshot' })
      .expect(409);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 409,
        error: 'Conflict',
        message: 'A sync is already running',
        path: '/sync',
      }),
    );
    expect(body).not.toHaveProperty('stack');
  });

  it('edge: unmapped upstream country is skipped without wiping DB', async () => {
    if (!dbReady) {
      return;
    }

    fetchByDate.mockResolvedValue([
      {
        country: 'Neverland',
        region: '',
        cases: { total: 1, new: 1 },
        deaths: { total: 0, new: 0 },
      },
    ]);

    const before = await prisma.covidDailyMetric.count();
    await ingest.runSyncBlocking('snapshot');
    const after = await prisma.covidDailyMetric.count();

    expect(after).toBe(before);

    const run = await prisma.syncRun.findFirst({
      orderBy: { startedAt: 'desc' },
    });
    // Success with 0 upserts is acceptable when all rows are unmapped
    expect(run?.status).toBe('success');
    expect(run?.recordsUpserted).toBe(0);
  });
});
