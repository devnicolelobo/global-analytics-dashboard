/**
 * Resolves the NestJS internal API base URL from NEXT_PUBLIC_API_URL only.
 * Never read API_NINJAS_KEY, DATABASE_URL, or other secrets here (REQ-NF-01).
 * Base URL must not be overridden from query string / user input (open-redirect risk).
 */

const ENV_KEY = 'NEXT_PUBLIC_API_URL';

function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

function requiresHttpsApiUrl(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Strip a single trailing slash so path joins stay predictable
 * (e.g. `http://localhost:3001` + `/covid/summary`).
 */
export function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Validate that the value looks like an absolute http(s) origin/base.
 * Rejects empty, relative paths, and non-http schemes.
 * When `requireHttps` is true (staging/production), plain HTTP is rejected.
 */
export function isValidApiBaseUrl(
  value: string,
  options?: { requireHttps?: boolean },
): boolean {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    if (options?.requireHttps && parsed.protocol !== 'https:') {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve and normalize the API base URL.
 * In development, missing/invalid values throw immediately (fail fast — no silent fetch to "/").
 * In production builds, still throws: a misconfigured base URL must not ship silently.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!raw) {
    const hint = isDevelopment()
      ? `Set ${ENV_KEY} in web/.env (e.g. http://localhost:3001). See web/.env.example.`
      : `Missing ${ENV_KEY}. Rebuild web with the correct API origin (HTTPS in staging/production).`;
    throw new Error(hint);
  }

  const normalized = stripTrailingSlash(raw);
  const requireHttps = requiresHttpsApiUrl();

  if (!isValidApiBaseUrl(normalized, { requireHttps })) {
    throw new Error(
      requireHttps
        ? `Invalid ${ENV_KEY}: staging/production must use an absolute HTTPS URL.`
        : `Invalid ${ENV_KEY}: must be an absolute http(s) URL (got a value that is not a valid URL).`,
    );
  }

  return normalized;
}
