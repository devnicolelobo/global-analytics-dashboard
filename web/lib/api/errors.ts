import type { ErrorResponse } from './types';

/** Why the client failed — helps UI choose loading vs toast vs retry. */
export type ApiErrorKind = 'http' | 'network' | 'parse' | 'timeout' | 'abort';

export interface ApiErrorOptions {
  kind: ApiErrorKind;
  statusCode?: number;
  error?: string;
  path?: string;
  timestamp?: string;
  /** Original cause (e.g. TypeError from fetch) — not shown in UI. */
  cause?: unknown;
}

/**
 * Strip tags / control chars so UI can render `message` as plain text.
 * Envelope fields are untrusted input (API_SPEC §4) — never treat as HTML.
 */
export function sanitizeErrorMessage(raw: unknown): string {
  if (typeof raw !== 'string') {
    return 'Unexpected error';
  }

  const withoutTags = raw.replace(/<[^>]*>/g, '');
  const cleaned = withoutTags.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  return cleaned.length > 0 ? cleaned : 'Unexpected error';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Best-effort parse of API_SPEC §4.1 envelope. Missing/extra fields are tolerated.
 */
export function parseErrorEnvelope(body: unknown): Partial<ErrorResponse> | null {
  if (!isRecord(body)) {
    return null;
  }

  const envelope: Partial<ErrorResponse> = {};

  if (typeof body.statusCode === 'number') {
    envelope.statusCode = body.statusCode;
  }
  if (typeof body.error === 'string') {
    envelope.error = body.error;
  }
  if (typeof body.message === 'string') {
    envelope.message = body.message;
  }
  if (typeof body.timestamp === 'string') {
    envelope.timestamp = body.timestamp;
  }
  if (typeof body.path === 'string') {
    envelope.path = body.path;
  }

  return Object.keys(envelope).length > 0 ? envelope : null;
}

/**
 * Typed failure from the internal API client.
 * Do not put secrets or full response bodies into `message`.
 */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly statusCode?: number;
  readonly error?: string;
  readonly path?: string;
  readonly timestamp?: string;

  constructor(message: string, options: ApiErrorOptions) {
    super(sanitizeErrorMessage(message));
    this.name = 'ApiError';
    this.kind = options.kind;
    this.statusCode = options.statusCode;
    this.error = options.error;
    this.path = options.path;
    this.timestamp = options.timestamp;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }

  /** Build from a non-OK HTTP response + optional JSON body. */
  static fromHttpResponse(
    statusCode: number,
    body: unknown,
    fallbackPath?: string,
  ): ApiError {
    const envelope = parseErrorEnvelope(body);
    const message =
      envelope?.message ??
      `Request failed with status ${statusCode}`;

    return new ApiError(message, {
      kind: 'http',
      statusCode: envelope?.statusCode ?? statusCode,
      error: envelope?.error,
      path: envelope?.path ?? fallbackPath,
      timestamp: envelope?.timestamp,
    });
  }

  static network(cause?: unknown): ApiError {
    return new ApiError('Network request failed', {
      kind: 'network',
      cause,
    });
  }

  static parse(cause?: unknown): ApiError {
    return new ApiError('Failed to parse API response as JSON', {
      kind: 'parse',
      cause,
    });
  }

  static timeout(ms: number): ApiError {
    return new ApiError(`Request timed out after ${ms}ms`, {
      kind: 'timeout',
    });
  }

  static aborted(): ApiError {
    return new ApiError('Request was aborted', {
      kind: 'abort',
    });
  }
}
