/**
 * fetch helper for static assets (GeoJSON) with timeout and byte cap.
 * Mirrors API client limits — treat same-origin static files as untrusted at parse time.
 */
import { DEFAULT_TIMEOUT_MS } from '@/lib/api/http';

export const DEFAULT_FETCH_MAX_BYTES = 5 * 1024 * 1024;

export type FetchTextLimitedOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  maxBytes?: number;
};

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

function assertWithinByteLimit(byteLength: number, maxBytes: number): void {
  if (byteLength > maxBytes) {
    throw new Error('Response payload too large.');
  }
}

/**
 * GET text with combined caller signal + timeout and a maximum body size.
 */
export async function fetchTextLimited(
  url: string,
  options: FetchTextLimitedOptions = {},
): Promise<string> {
  const timeoutMs =
    options.timeoutMs === undefined ? DEFAULT_TIMEOUT_MS : options.timeoutMs;
  const maxBytes =
    options.maxBytes === undefined ? DEFAULT_FETCH_MAX_BYTES : options.maxBytes;

  const controller = new AbortController();
  const timers: ReturnType<typeof setTimeout>[] = [];

  const abortFromExternal = () => {
    if (!controller.signal.aborted) {
      controller.abort(options.signal?.reason);
    }
  };

  if (options.signal) {
    if (options.signal.aborted) {
      abortFromExternal();
    } else {
      options.signal.addEventListener('abort', abortFromExternal, {
        once: true,
      });
    }
  }

  if (timeoutMs > 0 && Number.isFinite(timeoutMs)) {
    timers.push(
      setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort(new Error('Request timed out'));
        }
      }, timeoutMs),
    );
  }

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error('Request failed.');
    }

    const contentLength = response.headers.get('content-length');
    if (contentLength !== null) {
      const declared = Number.parseInt(contentLength, 10);
      if (Number.isFinite(declared)) {
        assertWithinByteLimit(declared, maxBytes);
      }
    }

    const raw = await response.text();
    assertWithinByteLimit(raw.length, maxBytes);
    return raw;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    throw error instanceof Error ? error : new Error('Request failed.');
  } finally {
    for (const id of timers) {
      clearTimeout(id);
    }
  }
}
