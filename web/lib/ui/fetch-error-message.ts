/**
 * Shared recoverable fetch error copy for dashboard panels (DEV-94 / REQ-F-51).
 *
 * Prefer sanitized ApiError.message from the typed client; never expose stacks
 * or raw JSON envelopes in UI.
 */
import { ApiError, sanitizeErrorMessage } from '@/lib/api/errors';

export const DEFAULT_FETCH_ERROR_MESSAGE =
  'Something went wrong. Please try again.';

/** Map unknown fetch failures to safe English plain text. */
export function toFetchErrorMessage(
  error: unknown,
  fallback: string = DEFAULT_FETCH_ERROR_MESSAGE,
): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return sanitizeErrorMessage(error.message);
  }
  return fallback;
}
