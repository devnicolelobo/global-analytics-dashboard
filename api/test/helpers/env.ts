/**
 * Test environment defaults for e2e / integration suites (DEV-87).
 *
 * Security:
 * - Never embed a real API_NINJAS_KEY — CI must not call live upstream.
 * - Reject non-Postgres URLs (ADR-003) so tests cannot silently use SQLite.
 */

/** Default local Docker Postgres (`docker compose up -d`). Override with TEST_DATABASE_URL. */
export const DEFAULT_TEST_DATABASE_URL =
  'postgresql://gad:gad@localhost:5432/global_analytics';

const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\/.+/i;

/** Placeholder only — must never be used for live HTTP calls. */
export const TEST_API_NINJAS_KEY_PLACEHOLDER = 'test-key-not-for-live-calls';

/**
 * Fail closed if someone points tests at a non-Postgres DSN.
 * Does not log the URL (may contain credentials).
 */
export function assertPostgresDatabaseUrl(url: string): void {
  if (!POSTGRES_URL_PATTERN.test(url)) {
    throw new Error(
      'Test DATABASE_URL must be a PostgreSQL URL (ADR-003 — SQLite is not allowed)',
    );
  }
}

/**
 * Apply safe defaults before Nest ConfigModule validate() runs.
 *
 * - Existing env from shell/CI wins for DATABASE_URL / PORT / API key
 *   unless an explicit option is passed.
 * - `nodeEnv` option **forces** NODE_ENV (needed for production error-envelope tests).
 */
export function ensureTestEnv(options?: {
  nodeEnv?: string;
  databaseUrl?: string;
}): void {
  if (options?.databaseUrl) {
    assertPostgresDatabaseUrl(options.databaseUrl);
    process.env.DATABASE_URL = options.databaseUrl;
  } else {
    const resolved =
      process.env.DATABASE_URL ??
      process.env.TEST_DATABASE_URL ??
      DEFAULT_TEST_DATABASE_URL;
    assertPostgresDatabaseUrl(resolved);
    process.env.DATABASE_URL = resolved;
  }

  if (options?.nodeEnv !== undefined) {
    process.env.NODE_ENV = options.nodeEnv;
  } else {
    process.env.NODE_ENV ??= 'test';
  }

  process.env.PORT ??= '3001';
  process.env.API_NINJAS_KEY ??= TEST_API_NINJAS_KEY_PLACEHOLDER;
}
