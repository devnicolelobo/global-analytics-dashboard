import { getApiBaseUrl } from './config';
import { ApiError } from './errors';

/** Default request timeout — prevents hung UI when the API never responds. */
export const DEFAULT_TIMEOUT_MS = 12_000;

export interface GetJsonOptions {
  /** Extra abort signal (e.g. from React / caller). Combined with the timeout signal. */
  signal?: AbortSignal;
  /** Override default timeout; set `0` or `Infinity` to disable timeout. */
  timeoutMs?: number;
}

function joinUrl(base: string, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Merge caller signal + timeout into one AbortSignal.
 * Uses AbortSignal.any when available; otherwise aborts the controller when either fires.
 */
function createCombinedSignal(
  timeoutMs: number,
  external?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  const abortFromTimeout = () => {
    if (!controller.signal.aborted) {
      controller.abort(ApiError.timeout(timeoutMs));
    }
  };

  const abortFromExternal = () => {
    if (!controller.signal.aborted) {
      controller.abort(external?.reason ?? ApiError.aborted());
    }
  };

  if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
    timers.push(setTimeout(abortFromTimeout, timeoutMs));
  }

  if (external) {
    if (external.aborted) {
      abortFromExternal();
    } else {
      external.addEventListener('abort', abortFromExternal, { once: true });
    }
  }

  const cleanup = () => {
    for (const id of timers) {
      clearTimeout(id);
    }
  };

  return { signal: controller.signal, cleanup };
}

async function readBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';
  const raw = await response.text();

  if (raw.length === 0) {
    return null;
  }

  const looksJson =
    contentType.includes('application/json') ||
    raw.startsWith('{') ||
    raw.startsWith('[');

  if (!looksJson) {
    return raw;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (cause) {
    throw ApiError.parse(cause);
  }
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (isAbortError(error)) {
    const reason =
      typeof error === 'object' &&
      error !== null &&
      'cause' in error &&
      (error as { cause?: unknown }).cause instanceof ApiError
        ? ((error as { cause: ApiError }).cause)
        : undefined;

    if (reason) {
      return reason;
    }

    // Some runtimes put the abort reason on the signal / error differently.
    if (error instanceof Error && error.cause instanceof ApiError) {
      return error.cause;
    }

    return ApiError.aborted();
  }

  return ApiError.network(error);
}

/**
 * Low-level GET + JSON helper for the internal Nest API.
 * GET-only for MVP. No cookies/credentials unless explicitly required later.
 * Safe for Server Components and Client Components (native fetch only).
 */
export async function getJson<T>(
  path: string,
  options: GetJsonOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = joinUrl(baseUrl, path);
  const timeoutMs =
    options.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : options.timeoutMs;

  const { signal, cleanup } = createCombinedSignal(timeoutMs, options.signal);

  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Omit cookies by default — internal API is not session-cookie auth in MVP.
        credentials: 'omit',
        signal,
        cache: 'no-store',
      });
    } catch (error) {
      // If we aborted due to timeout, surface timeout ApiError (not generic network).
      if (signal.aborted && signal.reason instanceof ApiError) {
        throw signal.reason;
      }
      throw toApiError(error);
    }

    const body = await readBody(response);

    if (!response.ok) {
      throw ApiError.fromHttpResponse(response.status, body, path);
    }

    return body as T;
  } finally {
    cleanup();
  }
}
