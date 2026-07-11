// Fail-fast validation for api/.env — runs before the app accepts traffic.
// Never log secret values (DATABASE_URL credentials, API_NINJAS_KEY).
const POSTGRES_URL_PATTERN = /^postgres(ql)?:\/\/.+/i;

export interface EnvironmentVariables {
  DATABASE_URL: string;
  PORT: number;
  NODE_ENV: string;
  API_NINJAS_KEY?: string;
}

function parsePort(value: unknown): number {
  // Default avoids clashing with the Next.js dev server on 3000.
  if (value === undefined || value === '') {
    return 3001;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid integer between 1 and 65535');
  }

  return port;
}

function validateDatabaseUrl(value: unknown): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('DATABASE_URL is required');
  }

  if (!POSTGRES_URL_PATTERN.test(value)) {
    throw new Error(
      'DATABASE_URL is malformed — expected a PostgreSQL connection URL',
    );
  }

  return value;
}

function validateNodeEnv(value: unknown): string {
  if (value === undefined || value === '') {
    return 'development';
  }

  if (typeof value !== 'string') {
    throw new Error('NODE_ENV must be a string');
  }

  return value;
}

function validateApiNinjasKey(value: unknown): string | undefined {
  // Optional at boot — required once the ingest module calls API Ninjas.
  if (value === undefined || value === '') {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('API_NINJAS_KEY must be a string when provided');
  }

  return value;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  return {
    DATABASE_URL: validateDatabaseUrl(config.DATABASE_URL),
    PORT: parsePort(config.PORT),
    NODE_ENV: validateNodeEnv(config.NODE_ENV),
    API_NINJAS_KEY: validateApiNinjasKey(config.API_NINJAS_KEY),
  };
}
