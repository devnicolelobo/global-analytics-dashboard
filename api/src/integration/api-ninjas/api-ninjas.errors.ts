/**
 * Typed errors for upstream COVID-19 HTTP integration.
 * Ingest layer catches these — never expose API keys in messages.
 */

export type UpstreamErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_PARAMS'
  | 'BAD_RESPONSE'
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE'
  | 'TIMEOUT';

export abstract class UpstreamError extends Error {
  abstract readonly code: UpstreamErrorCode;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/** API_NINJAS_KEY is missing when the client is invoked. */
export class UpstreamMissingApiKeyError extends UpstreamError {
  readonly code = 'MISSING_API_KEY' as const;

  constructor() {
    super('API Ninjas API key is not configured');
  }
}

/** Caller passed invalid country name or date format. */
export class UpstreamInvalidParamsError extends UpstreamError {
  readonly code = 'INVALID_PARAMS' as const;

  constructor(message: string) {
    super(message);
  }
}

/** Response body is not valid JSON or does not match expected shape. */
export class UpstreamBadResponseError extends UpstreamError {
  readonly code = 'BAD_RESPONSE' as const;

  constructor(message: string) {
    super(message);
  }
}

/** HTTP 401 — invalid or revoked API key. */
export class UpstreamUnauthorizedError extends UpstreamError {
  readonly code = 'UNAUTHORIZED' as const;

  constructor() {
    super('API Ninjas rejected the API key');
  }
}

/** HTTP 429 — quota or rate limit exceeded. */
export class UpstreamRateLimitedError extends UpstreamError {
  readonly code = 'RATE_LIMITED' as const;

  constructor() {
    super('API Ninjas rate limit exceeded');
  }
}

/** HTTP 5xx or network failure after retries exhausted. */
export class UpstreamUnavailableError extends UpstreamError {
  readonly code = 'UNAVAILABLE' as const;

  constructor(message = 'API Ninjas is temporarily unavailable') {
    super(message);
  }
}

/** Request exceeded configured timeout. */
export class UpstreamTimeoutError extends UpstreamError {
  readonly code = 'TIMEOUT' as const;

  constructor(timeoutMs: number) {
    super(`API Ninjas request timed out after ${timeoutMs}ms`);
  }
}
