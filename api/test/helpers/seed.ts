import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Minimal COVID fixtures for API_SPEC §11 roll-up / series acceptance.
 *
 * Design goals:
 * - Deterministic totals (no live upstream).
 * - Multi-region Canada exercises country roll-up (sum regions).
 * - Short series history exercises ascending `date` ordering.
 * - Never seed secrets or production-like credentials.
 */

export const FIXTURE_REF_DATE = '2023-03-09';
export const FIXTURE_SERIES_D1 = '2020-03-01';
export const FIXTURE_SERIES_D2 = '2020-03-02';

const REF = new Date(`${FIXTURE_REF_DATE}T00:00:00.000Z`);
const D1 = new Date(`${FIXTURE_SERIES_D1}T00:00:00.000Z`);
const D2 = new Date(`${FIXTURE_SERIES_D2}T00:00:00.000Z`);

/** Countries catalogue used by choropleth / detail joins. */
export const FIXTURE_COUNTRIES = [
  { iso2: 'BR', name: 'Brazil', upstreamName: 'Brazil' },
  { iso2: 'CA', name: 'Canada', upstreamName: 'Canada' },
  { iso2: 'US', name: 'United States', upstreamName: 'United States' },
] as const;

/**
 * Expected GET /covid/summary casesTotal on FIXTURE_REF_DATE after §8 roll-up:
 * BR 100 + CA (40+60) + US 200 = 400.
 */
export const EXPECTED_GLOBAL_CASES_TOTAL = 400;

/** Expected CA rolled casesTotal on latest date (Ontario + Quebec). */
export const EXPECTED_CA_CASES_TOTAL = 100;

/**
 * Seed countries + latest-day metrics + short series history.
 * Call after `truncateAllTables` for a clean, deterministic DB.
 */
export async function seedCovidFixtures(prisma: PrismaService): Promise<void> {
  for (const country of FIXTURE_COUNTRIES) {
    await prisma.country.create({ data: { ...country } });
  }

  await prisma.covidDailyMetric.createMany({
    data: [
      {
        countryCode: 'BR',
        region: '',
        referenceDate: REF,
        casesTotal: 100,
        deathsTotal: 10,
        casesNew: 1,
        deathsNew: 0,
        source: 'api-ninjas',
      },
      {
        countryCode: 'CA',
        region: 'Ontario',
        referenceDate: REF,
        casesTotal: 40,
        deathsTotal: 4,
        casesNew: 2,
        deathsNew: null,
        source: 'api-ninjas',
      },
      {
        countryCode: 'CA',
        region: 'Quebec',
        referenceDate: REF,
        casesTotal: 60,
        deathsTotal: 6,
        casesNew: 3,
        deathsNew: 1,
        source: 'api-ninjas',
      },
      {
        countryCode: 'US',
        region: '',
        referenceDate: REF,
        casesTotal: 200,
        deathsTotal: 20,
        casesNew: 5,
        deathsNew: 0,
        source: 'api-ninjas',
      },
      {
        countryCode: 'BR',
        region: '',
        referenceDate: D1,
        casesTotal: 1,
        deathsTotal: 0,
        casesNew: 1,
        deathsNew: 0,
        source: 'api-ninjas',
      },
      {
        countryCode: 'BR',
        region: '',
        referenceDate: D2,
        casesTotal: 2,
        deathsTotal: 0,
        casesNew: 1,
        deathsNew: 0,
        source: 'api-ninjas',
      },
      {
        countryCode: 'US',
        region: '',
        referenceDate: D1,
        casesTotal: 10,
        deathsTotal: 1,
        casesNew: 2,
        deathsNew: 0,
        source: 'api-ninjas',
      },
    ],
  });
}

/** Insert a successful SyncRun so meta.lastSuccessfulSyncAt is non-null. */
export async function seedSuccessfulSyncRun(
  prisma: PrismaService,
  completedAt = new Date('2026-07-08T06:00:00.000Z'),
): Promise<string> {
  const run = await prisma.syncRun.create({
    data: {
      status: 'success',
      mode: 'snapshot',
      source: 'api-ninjas',
      recordsUpserted: 7,
      startedAt: new Date(completedAt.getTime() - 60_000),
      completedAt,
    },
  });
  return run.id;
}
