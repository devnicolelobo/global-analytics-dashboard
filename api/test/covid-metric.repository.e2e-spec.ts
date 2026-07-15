import { CovidMetricRepository } from '../src/ingest/covid-metric.repository';
import { NormalizedMetricInput } from '../src/ingest/normalized-metric.types';
import { PrismaService } from '../src/prisma/prisma.service';

describe('CovidMetricRepository (integration)', () => {
  const testCountryCode = 'XZ';
  const testRegion = '__covid_metric_repository_integration__';
  const referenceDate = new Date('2023-03-09T00:00:00.000Z');

  let prisma: PrismaService;
  let repository: CovidMetricRepository;

  const baseMetric: NormalizedMetricInput = {
    countryCode: testCountryCode,
    countryName: 'Integration Test Country',
    upstreamName: 'Integration Test Country',
    region: testRegion,
    referenceDate: '2023-03-09',
    source: 'api-ninjas',
  };

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgresql://gad:gad@localhost:5432/global_analytics';

    prisma = new PrismaService();
    repository = new CovidMetricRepository(prisma);
    await prisma.$connect();
  });

  beforeEach(async () => {
    await cleanTestData();
  });

  afterEach(async () => {
    await cleanTestData();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('merges cases then deaths into one row on the natural key', async () => {
    const casesResult = await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        casesTotal: 100,
        casesNew: 3,
      },
    ]);

    const deathsResult = await repository.upsertNormalizedMetrics([
      {
        ...baseMetric,
        deathsTotal: 10,
        deathsNew: 1,
      },
    ]);

    const persistedRows = await prisma.covidDailyMetric.findMany({
      where: {
        countryCode: testCountryCode,
        region: testRegion,
        referenceDate,
      },
    });

    expect(casesResult.recordsUpserted).toBe(1);
    expect(deathsResult.recordsUpserted).toBe(1);
    expect(persistedRows).toHaveLength(1);
    expect(persistedRows[0]).toMatchObject({
      countryCode: testCountryCode,
      region: testRegion,
      referenceDate,
      casesTotal: 100,
      casesNew: 3,
      deathsTotal: 10,
      deathsNew: 1,
      source: 'api-ninjas',
    });
  });

  async function cleanTestData(): Promise<void> {
    await prisma.covidDailyMetric.deleteMany({
      where: {
        countryCode: testCountryCode,
        region: testRegion,
      },
    });
    await prisma.country.deleteMany({
      where: { iso2: testCountryCode },
    });
  }
});
