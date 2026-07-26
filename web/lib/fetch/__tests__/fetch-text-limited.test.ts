import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_FETCH_MAX_BYTES,
  fetchTextLimited,
} from '../fetch-text-limited';

describe('fetchTextLimited', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns response text when within size limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(
        new Response('{"type":"FeatureCollection"}', { status: 200 }),
      ),
    );

    await expect(fetchTextLimited('/geo/countries.json')).resolves.toBe(
      '{"type":"FeatureCollection"}',
    );
  });

  it('rejects payloads larger than maxBytes', async () => {
    const oversized = 'x'.repeat(DEFAULT_FETCH_MAX_BYTES + 1);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce(new Response(oversized, { status: 200 })),
    );

    await expect(fetchTextLimited('/geo/countries.json')).rejects.toThrow(
      /too large/i,
    );
  });

  it('aborts when timeoutMs elapses', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(
        (_url: string, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => {
                reject(new DOMException('Aborted', 'AbortError'));
              },
              { once: true },
            );
          }),
      ),
    );

    const promise = fetchTextLimited('/geo/countries.json', { timeoutMs: 50 });
    const assertion = expect(promise).rejects.toMatchObject({
      name: 'AbortError',
    });
    await vi.advanceTimersByTimeAsync(60);
    await assertion;
  });
});
