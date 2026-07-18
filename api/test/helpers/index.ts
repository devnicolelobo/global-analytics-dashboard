/**
 * Shared e2e / integration test helpers (DEV-87).
 * Real PostgreSQL for integration confidence; mock upstream for CI safety.
 */

export {
  createPrismaMock,
  createTestApp,
  type CreateTestAppOptions,
} from './app';
export {
  connectPrisma,
  disconnectPrisma,
  isDatabaseReachable,
  truncateAllTables,
} from './db';
export {
  assertPostgresDatabaseUrl,
  DEFAULT_TEST_DATABASE_URL,
  ensureTestEnv,
  TEST_API_NINJAS_KEY_PLACEHOLDER,
} from './env';
export {
  EXPECTED_CA_CASES_TOTAL,
  EXPECTED_GLOBAL_CASES_TOTAL,
  FIXTURE_COUNTRIES,
  FIXTURE_REF_DATE,
  FIXTURE_SERIES_D1,
  FIXTURE_SERIES_D2,
  seedCovidFixtures,
  seedSuccessfulSyncRun,
} from './seed';
