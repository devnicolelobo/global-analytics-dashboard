/**
 * Stable JSON error envelope for all HTTP error responses (API_SPEC §4.1).
 * Production responses must never include stack traces (REQ-F-13).
 * Used by HttpExceptionFilter and for typing in e2e tests.
 */
export interface ErrorResponseDto {
  /** HTTP status code (e.g. 404, 400, 500). */
  statusCode: number;
  /** Short Nest-aligned category (e.g. "Not Found"). */
  error: string;
  /** Human-readable, UI-safe detail — no secrets or stacks. */
  message: string;
  /** Error time as ISO 8601 UTC. */
  timestamp: string;
  /** Request path without query string (avoids echoing tokens). */
  path: string;
}
