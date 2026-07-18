import {
  assertPostgresDatabaseUrl,
  DEFAULT_TEST_DATABASE_URL,
  ensureTestEnv,
  TEST_API_NINJAS_KEY_PLACEHOLDER,
} from '../../test/helpers/env';

/**
 * Unit coverage for test helpers (edge / critical).
 * Lives under src/ so default `npm test` (rootDir=src) picks it up.
 */
describe('assertPostgresDatabaseUrl', () => {
  it('accepts postgresql URLs', () => {
    expect(() =>
      assertPostgresDatabaseUrl(DEFAULT_TEST_DATABASE_URL),
    ).not.toThrow();
    expect(() =>
      assertPostgresDatabaseUrl('postgres://u:p@localhost:5432/db'),
    ).not.toThrow();
  });

  it('rejects sqlite and empty (critical — ADR-003)', () => {
    expect(() => assertPostgresDatabaseUrl('file:./dev.db')).toThrow(
      /PostgreSQL/,
    );
    expect(() => assertPostgresDatabaseUrl('')).toThrow(/PostgreSQL/);
    expect(() => assertPostgresDatabaseUrl('mysql://u:p@localhost/db')).toThrow(
      /PostgreSQL/,
    );
  });
});

describe('ensureTestEnv', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('sets defaults when unset', () => {
    delete process.env.DATABASE_URL;
    delete process.env.TEST_DATABASE_URL;
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.API_NINJAS_KEY;

    ensureTestEnv();

    expect(process.env.DATABASE_URL).toBe(DEFAULT_TEST_DATABASE_URL);
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.PORT).toBe('3001');
    expect(process.env.API_NINJAS_KEY).toBe(TEST_API_NINJAS_KEY_PLACEHOLDER);
  });

  it('does not overwrite existing DATABASE_URL from CI/shell', () => {
    process.env.DATABASE_URL = 'postgresql://ci:ci@db:5432/ci';
    ensureTestEnv();
    expect(process.env.DATABASE_URL).toBe('postgresql://ci:ci@db:5432/ci');
  });

  it('forces NODE_ENV when option is provided (production envelope edge case)', () => {
    process.env.NODE_ENV = 'test';
    ensureTestEnv({ nodeEnv: 'production' });
    expect(process.env.NODE_ENV).toBe('production');
  });

  it('throws when explicit databaseUrl is not Postgres', () => {
    expect(() => ensureTestEnv({ databaseUrl: 'file:./x.db' })).toThrow(
      /PostgreSQL/,
    );
  });
});
