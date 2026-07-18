import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ErrorResponseDto } from '../src/common/errors/error-response.dto';
import {
  CountriesResponseDto,
  CountryDetailResponseDto,
  CountrySeriesResponseDto,
  GlobalSeriesResponseDto,
  SummaryResponseDto,
} from '../src/covid/dto';
import { IngestService } from '../src/ingest/ingest.service';
import { UpstreamUnavailableError } from '../src/integration/api-ninjas/api-ninjas.errors';
import { PrismaService } from '../src/prisma/prisma.service';
import { SyncStatusDto } from '../src/sync/dto/sync-status.dto';
import {
  createTestApp,
  DEFAULT_TEST_DATABASE_URL,
  EXPECTED_GLOBAL_CASES_TOTAL,
  FIXTURE_COUNTRIES,
  FIXTURE_REF_DATE,
  FIXTURE_SERIES_D1,
  FIXTURE_SERIES_D2,
  isDatabaseReachable,
  seedCovidFixtures,
  seedSuccessfulSyncRun,
  truncateAllTables,
} from './helpers';

/**
 * API_SPEC §11 acceptance against real PostgreSQL (DEV-87 / Option A).
 * Upstream is always mocked — no live API Ninjas calls.
 */
describe('API_SPEC §11 acceptance (integration e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let ingest: IngestService;
  let dbReady = false;
  let fetchByDate: jest.Mock;

  beforeAll(async () => {
    dbReady = await isDatabaseReachable(DEFAULT_TEST_DATABASE_URL);
    if (!dbReady) {
      console.warn(
        'Skipping API_SPEC §11 integration e2e: PostgreSQL unreachable (docker compose up -d)',
      );
      return;
    }

    fetchByDate = jest.fn().mockResolvedValue([
      {
        country: 'Brazil',
        region: '',
        cases: { total: 999, new: 0 },
        deaths: { total: 1, new: 0 },
      },
    ]);

    const boot = await createTestApp({
      upstream: {
        fetchByDate,
        fetchByCountry: jest.fn().mockResolvedValue([]),
      },
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
    await seedSuccessfulSyncRun(prisma);
    fetchByDate.mockClear();
    fetchByDate.mockResolvedValue([
      {
        country: 'Brazil',
        region: '',
        cases: { total: 999, new: 0 },
        deaths: { total: 1, new: 0 },
      },
    ]);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('Country list returns ISO codes matching seeded countries', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/covid/countries')
      .expect(200);
    const body = response.body as CountriesResponseDto;
    const codes = body.countries.map((c) => c.code).sort();

    expect(codes).toEqual([...FIXTURE_COUNTRIES.map((c) => c.iso2)].sort());
    expect(body.referenceDate).toBe(FIXTURE_REF_DATE);
    // Critical: never leak subnational region names in MVP JSON
    expect(JSON.stringify(body)).not.toMatch(/Ontario|Quebec/);
  });

  it('Summary totals match fixture roll-up for latest date', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/covid/summary')
      .expect(200);
    const body = response.body as SummaryResponseDto;

    expect(body.scope).toBe('global');
    expect(body.referenceDate).toBe(FIXTURE_REF_DATE);
    expect(body.metrics?.casesTotal).toBe(EXPECTED_GLOBAL_CASES_TOTAL);
    expect(body.meta.dataSource).toBe('api-ninjas');
    expect(body.meta.lastSuccessfulSyncAt).toBe('2026-07-08T06:00:00.000Z');
  });

  it('Series ordering is strictly ascending by date', async () => {
    if (!dbReady) {
      return;
    }

    const country = await request(app.getHttpServer())
      .get('/covid/countries/BR/series')
      .query({ metric: 'casesTotal' })
      .expect(200);
    const countryBody = country.body as CountrySeriesResponseDto;
    const countryDates = countryBody.points.map((p) => p.date);

    expect(countryDates).toEqual([
      FIXTURE_SERIES_D1,
      FIXTURE_SERIES_D2,
      FIXTURE_REF_DATE,
    ]);
    expect(countryDates).toEqual([...countryDates].sort());

    const global = await request(app.getHttpServer())
      .get('/covid/series')
      .query({ metric: 'casesTotal' })
      .expect(200);
    const globalBody = global.body as GlobalSeriesResponseDto;
    const globalDates = globalBody.points.map((p) => p.date);

    expect(globalDates).toEqual([...globalDates].sort());
    // D1: BR 1 + US 10 = 11
    expect(globalBody.points[0]).toEqual({
      date: FIXTURE_SERIES_D1,
      value: 11,
    });
  });

  it('Unknown country → 404 envelope', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/covid/countries/ZZ')
      .expect(404);
    const body = response.body as ErrorResponseDto;

    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        path: '/covid/countries/ZZ',
      }),
    );
    expect(body).not.toHaveProperty('stack');
  });

  it('Invalid metric → 400 envelope', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/covid/series')
      .query({ metric: 'invalid' })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body).not.toHaveProperty('stack');
    expect(JSON.stringify(body)).not.toContain('DATABASE_URL');
  });

  it('Country detail rolls up multi-region CA without exposing regions', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/covid/countries/CA')
      .expect(200);
    const body = response.body as CountryDetailResponseDto;

    expect(body.metrics?.casesTotal).toBe(100);
    expect(body.meta.hasRegionalBreakdown).toBe(true);
    expect(JSON.stringify(body)).not.toContain('Ontario');
  });

  it('Sync trigger creates SyncRun; status reflects success', async () => {
    if (!dbReady) {
      return;
    }

    // Avoid racing a background POST with a second sync — use blocking ingest.
    await ingest.runSyncBlocking('snapshot');

    const run = await prisma.syncRun.findFirst({
      where: { status: 'success', mode: 'snapshot' },
      orderBy: { completedAt: 'desc' },
    });
    expect(run).not.toBeNull();
    expect(run!.recordsUpserted).toBeGreaterThanOrEqual(0);

    const status = await request(app.getHttpServer())
      .get('/sync/status')
      .expect(200);
    const body = status.body as SyncStatusDto;

    expect(body.lastSyncStatus).toBe('success');
    expect(body.dataSource).toBe('api-ninjas');
    expect(body.lastSuccessfulSyncAt).not.toBeNull();
  });

  it('POST /sync → 202 Accepted and creates running then completed SyncRun', async () => {
    if (!dbReady) {
      return;
    }

    const accepted = await request(app.getHttpServer())
      .post('/sync')
      .send({ mode: 'snapshot' })
      .expect(202);
    const acceptedBody = accepted.body as {
      syncRunId: string;
      status: string;
      mode: string;
    };

    expect(acceptedBody).toEqual(
      expect.objectContaining({
        status: 'running',
        mode: 'snapshot',
      }),
    );
    const syncRunId = acceptedBody.syncRunId;

    // Poll until background ingest finishes (success or failed).
    let finalStatus: string | null = null;
    for (let i = 0; i < 40; i++) {
      const row = await prisma.syncRun.findUnique({
        where: { id: syncRunId },
      });
      if (row && row.status !== 'running') {
        finalStatus = row.status;
        break;
      }
      await new Promise((r) => setTimeout(r, 50));
    }

    expect(finalStatus).toBe('success');
  });

  it('Sync failure leaves prior metrics unchanged (REQ-F-05)', async () => {
    if (!dbReady) {
      return;
    }

    const before = await prisma.covidDailyMetric.count();
    expect(before).toBeGreaterThan(0);

    fetchByDate.mockRejectedValueOnce(
      new UpstreamUnavailableError('upstream 503 for tests'),
    );

    await ingest.runSyncBlocking('snapshot');

    const after = await prisma.covidDailyMetric.count();
    expect(after).toBe(before);

    const br = await prisma.covidDailyMetric.findFirst({
      where: {
        countryCode: 'BR',
        region: '',
        referenceDate: new Date(`${FIXTURE_REF_DATE}T00:00:00.000Z`),
      },
    });
    expect(br?.casesTotal).toBe(100);

    const status = await request(app.getHttpServer())
      .get('/sync/status')
      .expect(200);
    expect((status.body as SyncStatusDto).lastSyncStatus).toBe('failed');
  });

  it('GET /health → 200 against real Postgres', async () => {
    if (!dbReady) {
      return;
    }

    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200);

    expect(response.body).toEqual(expect.objectContaining({ status: 'ok' }));
    expect(JSON.stringify(response.body)).not.toContain('gad');
    expect(JSON.stringify(response.body)).not.toContain('DATABASE');
  });

  it('empty DB → summary null metrics / empty series (edge)', async () => {
    if (!dbReady) {
      return;
    }

    await truncateAllTables(prisma);

    const summary = await request(app.getHttpServer())
      .get('/covid/summary')
      .expect(200);
    expect(summary.body).toEqual(
      expect.objectContaining({
        scope: 'global',
        referenceDate: null,
        metrics: null,
      }),
    );

    const series = await request(app.getHttpServer())
      .get('/covid/series')
      .expect(200);
    const seriesBody = series.body as GlobalSeriesResponseDto;
    expect(seriesBody.points).toEqual([]);
  });
});
