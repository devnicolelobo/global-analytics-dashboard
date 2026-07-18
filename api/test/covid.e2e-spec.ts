import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { ErrorResponseDto } from './../src/common/errors/error-response.dto';
import { configureApp } from './../src/configure-app';
import { AppModule } from './../src/app.module';
import {
  CountriesResponseDto,
  CountryDetailResponseDto,
  CountrySeriesResponseDto,
  GlobalSeriesResponseDto,
} from './../src/covid/dto';
import { IngestService } from './../src/ingest/ingest.service';
import { PrismaService } from './../src/prisma/prisma.service';

const REF_DATE = new Date('2023-03-09T00:00:00.000Z');
const SYNC_AT = new Date('2026-07-08T06:00:00.000Z');
const SERIES_D1 = new Date('2020-03-01T00:00:00.000Z');
const SERIES_D2 = new Date('2020-03-02T00:00:00.000Z');

describe('COVID read endpoints (e2e)', () => {
  let app: INestApplication<App>;
  let prismaMock: {
    onModuleInit: jest.Mock;
    onModuleDestroy: jest.Mock;
    $queryRaw: jest.Mock;
    country: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
    covidDailyMetric: {
      aggregate: jest.Mock;
      findMany: jest.Mock;
    };
    syncRun: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    process.env.DATABASE_URL =
      'postgresql://gad:gad@localhost:5432/global_analytics';

    prismaMock = {
      onModuleInit: jest.fn(),
      onModuleDestroy: jest.fn(),
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
      country: {
        findMany: jest.fn().mockResolvedValue([
          { iso2: 'BR', name: 'Brazil' },
          { iso2: 'CA', name: 'Canada' },
          { iso2: 'US', name: 'United States' },
        ]),
        findUnique: jest
          .fn()
          .mockImplementation(({ where }: { where: { iso2: string } }) => {
            const map: Record<string, { iso2: string; name: string }> = {
              BR: { iso2: 'BR', name: 'Brazil' },
              CA: { iso2: 'CA', name: 'Canada' },
              US: { iso2: 'US', name: 'United States' },
            };
            return Promise.resolve(map[where.iso2] ?? null);
          }),
      },
      covidDailyMetric: {
        aggregate: jest.fn().mockResolvedValue({
          _max: { referenceDate: REF_DATE },
        }),
        findMany: jest.fn().mockImplementation(
          (args: {
            where?: {
              countryCode?: string;
              referenceDate?: Date | { gte?: Date; lte?: Date };
            };
            distinct?: string[];
            orderBy?: unknown;
          }) => {
            // hasRegionalBreakdown distinct regions
            if (args.distinct?.includes('region')) {
              if (args.where?.countryCode === 'CA') {
                return Promise.resolve([
                  { region: 'Ontario' },
                  { region: 'Quebec' },
                ]);
              }
              return Promise.resolve([{ region: '' }]);
            }

            const ref = args.where?.referenceDate;
            const isExactDate = ref instanceof Date;

            // Latest-date snapshot rows (summary / countries / detail)
            if (isExactDate) {
              const countryCode = args.where?.countryCode;
              const allLatest = [
                {
                  countryCode: 'BR',
                  region: '',
                  referenceDate: REF_DATE,
                  casesTotal: 100,
                  deathsTotal: 10,
                  casesNew: 1,
                  deathsNew: 0,
                },
                {
                  countryCode: 'CA',
                  region: 'Ontario',
                  referenceDate: REF_DATE,
                  casesTotal: 40,
                  deathsTotal: 4,
                  casesNew: 2,
                  deathsNew: null,
                },
                {
                  countryCode: 'CA',
                  region: 'Quebec',
                  referenceDate: REF_DATE,
                  casesTotal: 60,
                  deathsTotal: 6,
                  casesNew: 3,
                  deathsNew: 1,
                },
                {
                  countryCode: 'US',
                  region: '',
                  referenceDate: REF_DATE,
                  casesTotal: 200,
                  deathsTotal: 20,
                  casesNew: 5,
                  deathsNew: 0,
                },
              ];
              if (countryCode) {
                return Promise.resolve(
                  allLatest.filter((row) => row.countryCode === countryCode),
                );
              }
              return Promise.resolve(allLatest);
            }

            // Series rows (optional date range filter)
            const seriesRows = [
              {
                countryCode: 'BR',
                region: '',
                referenceDate: SERIES_D1,
                casesTotal: 1,
                deathsTotal: 0,
                casesNew: 1,
                deathsNew: 0,
              },
              {
                countryCode: 'BR',
                region: '',
                referenceDate: SERIES_D2,
                casesTotal: 2,
                deathsTotal: 0,
                casesNew: 1,
                deathsNew: 0,
              },
              {
                countryCode: 'US',
                region: '',
                referenceDate: SERIES_D1,
                casesTotal: 10,
                deathsTotal: 1,
                casesNew: 2,
                deathsNew: 0,
              },
            ];

            let filtered = seriesRows;
            if (args.where?.countryCode) {
              filtered = filtered.filter(
                (row) => row.countryCode === args.where?.countryCode,
              );
            }

            const range = ref && !(ref instanceof Date) ? ref : undefined;
            if (range?.gte) {
              filtered = filtered.filter(
                (row) => row.referenceDate >= range.gte!,
              );
            }
            if (range?.lte) {
              filtered = filtered.filter(
                (row) => row.referenceDate <= range.lte!,
              );
            }

            return Promise.resolve(filtered);
          },
        ),
      },
      syncRun: {
        findFirst: jest.fn().mockResolvedValue({ completedAt: SYNC_AT }),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(IngestService)
      .useValue({ runSync: jest.fn(), runSyncBlocking: jest.fn() })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /covid/summary → 200 global rollup shape', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/summary')
      .expect(200);

    // BR 100 + CA (40+60) + US 200 = 400; deaths 10+10+20 = 40; new 1+5+5 = 11
    expect(response.body).toEqual({
      scope: 'global',
      referenceDate: '2023-03-09',
      metrics: {
        casesTotal: 400,
        deathsTotal: 40,
        casesNew: 11,
        deathsNew: 1,
      },
      meta: {
        lastSuccessfulSyncAt: '2026-07-08T06:00:00.000Z',
        dataSource: 'api-ninjas',
      },
    });
  });

  it('GET /covid/countries → 200 sorted by metric (default casesTotal)', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries')
      .expect(200);
    const body = response.body as CountriesResponseDto;

    expect(body.referenceDate).toBe('2023-03-09');
    expect(body.meta.count).toBe(3);
    expect(body.countries.map((c) => c.code)).toEqual(['US', 'BR', 'CA']);
    expect(body.countries[0].metrics?.casesTotal).toBe(200);
    expect(body.countries[2].metrics?.casesTotal).toBe(100);
    // Regional CA rolled up — no region field in response
    expect(JSON.stringify(body)).not.toContain('Ontario');
  });

  it('GET /covid/countries?metric=casesNew respects sort key', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries')
      .query({ metric: 'casesNew' })
      .expect(200);
    const body = response.body as CountriesResponseDto;

    // US and CA both 5 — stable sort keeps CA before US from catalogue order
    expect(body.countries.map((c) => c.code)).toEqual(['CA', 'US', 'BR']);
  });

  it('GET /covid/countries/BR → 200 country detail', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries/BR')
      .expect(200);

    expect(response.body).toEqual({
      scope: 'country',
      country: { code: 'BR', name: 'Brazil' },
      referenceDate: '2023-03-09',
      metrics: {
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
      },
      meta: {
        hasRegionalBreakdown: false,
        lastSuccessfulSyncAt: '2026-07-08T06:00:00.000Z',
      },
    });
  });

  it('GET /covid/countries/CA → hasRegionalBreakdown true and rolled metrics', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries/CA')
      .expect(200);
    const body = response.body as CountryDetailResponseDto;

    expect(body.metrics).toEqual({
      casesTotal: 100,
      deathsTotal: 10,
      casesNew: 5,
      deathsNew: 1,
    });
    expect(body.meta.hasRegionalBreakdown).toBe(true);
    expect(JSON.stringify(body)).not.toContain('Quebec');
  });

  it('GET /covid/countries/zz → 400 lowercase country code', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries/zz')
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.path).toBe('/covid/countries/zz');
    expect(body).not.toHaveProperty('stack');
  });

  it('GET /covid/countries/ZZ → 404 unknown country', async () => {
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
  });

  it('GET /covid/countries/BR/series → 200 sorted points', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries/BR/series')
      .query({ metric: 'casesTotal' })
      .expect(200);

    expect(response.body).toEqual({
      scope: 'country',
      country: { code: 'BR', name: 'Brazil' },
      metric: 'casesTotal',
      points: [
        { date: '2020-03-01', value: 1 },
        { date: '2020-03-02', value: 2 },
      ],
      meta: {
        pointCount: 2,
        from: '2020-03-01',
        to: '2020-03-02',
      },
    });
  });

  it('GET /covid/countries/BR/series?from&to filters range', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/countries/BR/series')
      .query({
        metric: 'casesTotal',
        from: '2020-03-02',
        to: '2020-03-02',
      })
      .expect(200);
    const body = response.body as CountrySeriesResponseDto;

    expect(body.points).toEqual([{ date: '2020-03-02', value: 2 }]);
    expect(body.meta).toEqual({
      pointCount: 1,
      from: '2020-03-02',
      to: '2020-03-02',
    });
  });

  it('GET /covid/series → 200 global aggregated points', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/series')
      .query({ metric: 'casesTotal' })
      .expect(200);
    const body = response.body as GlobalSeriesResponseDto;

    expect(body.scope).toBe('global');
    expect(body.metric).toBe('casesTotal');
    // 2020-03-01: BR 1 + US 10 = 11; 2020-03-02: BR 2 only = 2
    expect(body.points).toEqual([
      { date: '2020-03-01', value: 11 },
      { date: '2020-03-02', value: 2 },
    ]);
    expect(body.meta.pointCount).toBe(2);
  });

  it('GET /covid/series invalid metric → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/series')
      .query({ metric: 'invalid' })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body).not.toHaveProperty('stack');
  });

  it('GET /covid/series invalid date → 400 envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/covid/series')
      .query({ from: '03-01-2020' })
      .expect(400);
    const body = response.body as ErrorResponseDto;

    expect(body.statusCode).toBe(400);
  });

  it('empty DB → 200 with null metrics / empty series', async () => {
    prismaMock.covidDailyMetric.aggregate.mockResolvedValue({
      _max: { referenceDate: null },
    });
    prismaMock.covidDailyMetric.findMany.mockResolvedValue([]);
    prismaMock.syncRun.findFirst.mockResolvedValue(null);
    prismaMock.country.findMany.mockResolvedValue([]);

    const summary = await request(app.getHttpServer())
      .get('/covid/summary')
      .expect(200);
    expect(summary.body).toEqual({
      scope: 'global',
      referenceDate: null,
      metrics: null,
      meta: {
        lastSuccessfulSyncAt: null,
        dataSource: 'api-ninjas',
      },
    });

    const countries = await request(app.getHttpServer())
      .get('/covid/countries')
      .expect(200);
    const countriesBody = countries.body as CountriesResponseDto;
    expect(countriesBody.countries).toEqual([]);
    expect(countriesBody.meta.count).toBe(0);

    const series = await request(app.getHttpServer())
      .get('/covid/series')
      .expect(200);
    const seriesBody = series.body as GlobalSeriesResponseDto;
    expect(seriesBody.points).toEqual([]);
    expect(seriesBody.meta.pointCount).toBe(0);
  });
});
