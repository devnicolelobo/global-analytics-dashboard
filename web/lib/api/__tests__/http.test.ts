import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../errors';
import { getJson } from '../http';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('getJson', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001';
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('returns parsed JSON on a successful response', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, { scope: 'global', ok: true }),
    );

    await expect(getJson<{ ok: boolean }>('/covid/summary')).resolves.toEqual({
      scope: 'global',
      ok: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3001/covid/summary',
      expect.objectContaining({
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
      }),
    );
  });

  it('maps a non-OK envelope to ApiError', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      jsonResponse(404, {
        statusCode: 404,
        error: 'Not Found',
        message: "Country 'ZZ' not found",
        timestamp: '2026-07-08T18:30:00.000Z',
        path: '/covid/countries/ZZ',
      }),
    );

    const error = await getJson('/covid/countries/ZZ').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      kind: 'http',
      statusCode: 404,
      message: "Country 'ZZ' not found",
      path: '/covid/countries/ZZ',
    });
  });

  it('surfaces a timeout ApiError when the request exceeds timeoutMs', async () => {
    vi.mocked(fetch).mockImplementationOnce(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) {
            reject(new Error('missing signal'));
            return;
          }
          signal.addEventListener(
            'abort',
            () => {
              const abortError = new Error('Aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            },
            { once: true },
          );
        }),
    );

    await expect(getJson('/covid/summary', { timeoutMs: 40 })).rejects.toMatchObject({
      kind: 'timeout',
    });
  });

  it('maps a network failure to ApiError.network', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(getJson('/covid/summary')).rejects.toMatchObject({
      kind: 'network',
    });
  });
});
