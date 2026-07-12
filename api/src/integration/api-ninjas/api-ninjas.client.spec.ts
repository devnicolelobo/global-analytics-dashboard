import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AxiosError, AxiosHeaders } from 'axios';
import { of, throwError } from 'rxjs';
import { ApiNinjasClient } from './api-ninjas.client';
import {
  UpstreamBadResponseError,
  UpstreamInvalidParamsError,
  UpstreamMissingApiKeyError,
  UpstreamRateLimitedError,
  UpstreamTimeoutError,
  UpstreamUnauthorizedError,
  UpstreamUnavailableError,
} from './api-ninjas.errors';

describe('ApiNinjasClient', () => {
  let client: ApiNinjasClient;
  let httpGet: jest.Mock;
  let configGet: jest.Mock;

  const axiosConfig = { headers: new AxiosHeaders() };

  beforeEach(async () => {
    httpGet = jest.fn();
    configGet = jest.fn().mockReturnValue('test-api-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiNinjasClient,
        {
          provide: HttpService,
          useValue: { get: httpGet },
        },
        {
          provide: ConfigService,
          useValue: {
            get: configGet,
          },
        },
      ],
    }).compile();

    client = module.get(ApiNinjasClient);
    jest.spyOn(client as never, 'sleep').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('fetchByCountry returns typed series rows on success', async () => {
    httpGet.mockReturnValue(
      of({
        data: [
          {
            country: 'Brazil',
            region: '',
            cases: { '2023-03-09': { total: 100, new: 1 } },
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: axiosConfig,
      }),
    );

    const result = await client.fetchByCountry('Brazil');

    expect(result).toEqual([
      {
        country: 'Brazil',
        region: '',
        cases: { '2023-03-09': { total: 100, new: 1 } },
      },
    ]);
    expect(httpGet).toHaveBeenCalledWith(
      '/v1/covid19',
      expect.objectContaining({
        baseURL: 'https://api.api-ninjas.com',
        params: { country: 'Brazil' },
        headers: { 'X-Api-Key': 'test-api-key' },
      }),
    );
  });

  it('fetchByDate returns typed snapshot rows on success', async () => {
    httpGet.mockReturnValue(
      of({
        data: [
          {
            country: 'Brazil',
            region: '',
            cases: { total: 37076053, new: 0 },
          },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: axiosConfig,
      }),
    );

    const result = await client.fetchByDate('2023-03-09');

    expect(result).toEqual([
      {
        country: 'Brazil',
        region: '',
        cases: { total: 37076053, new: 0 },
      },
    ]);
    expect(httpGet).toHaveBeenCalledWith(
      '/v1/covid19',
      expect.objectContaining({
        params: { date: '2023-03-09' },
      }),
    );
  });

  it('accepts an empty array response', async () => {
    httpGet.mockReturnValue(
      of({
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: axiosConfig,
      }),
    );

    await expect(client.fetchByDate('2024-06-01')).resolves.toEqual([]);
  });

  it('throws when API_NINJAS_KEY is missing', async () => {
    configGet.mockReturnValue(undefined);

    await expect(client.fetchByDate('2023-03-09')).rejects.toBeInstanceOf(
      UpstreamMissingApiKeyError,
    );
    expect(httpGet).not.toHaveBeenCalled();
  });

  it('maps HTTP 401 to UpstreamUnauthorizedError', async () => {
    httpGet.mockReturnValue(
      of({
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config: axiosConfig,
      }),
    );

    await expect(client.fetchByCountry('Brazil')).rejects.toBeInstanceOf(
      UpstreamUnauthorizedError,
    );
  });

  it('maps HTTP 429 to UpstreamRateLimitedError', async () => {
    httpGet.mockReturnValue(
      of({
        data: {},
        status: 429,
        statusText: 'Too Many Requests',
        headers: {},
        config: axiosConfig,
      }),
    );

    await expect(client.fetchByCountry('Brazil')).rejects.toBeInstanceOf(
      UpstreamRateLimitedError,
    );
  });

  it('retries on HTTP 500 then succeeds', async () => {
    httpGet
      .mockReturnValueOnce(
        of({
          data: {},
          status: 500,
          statusText: 'Internal Server Error',
          headers: {},
          config: axiosConfig,
        }),
      )
      .mockReturnValueOnce(
        of({
          data: [
            {
              country: 'Brazil',
              region: '',
              cases: { total: 1, new: 0 },
            },
          ],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: axiosConfig,
        }),
      );

    const result = await client.fetchByDate('2023-03-09', { type: 'cases' });

    expect(result).toHaveLength(1);
    expect(httpGet).toHaveBeenCalledTimes(2);
  });

  it('maps request timeout to UpstreamTimeoutError', async () => {
    const timeoutError = new AxiosError('timeout');
    timeoutError.code = 'ECONNABORTED';

    httpGet.mockReturnValue(throwError(() => timeoutError));

    await expect(client.fetchByCountry('Brazil')).rejects.toBeInstanceOf(
      UpstreamTimeoutError,
    );
  });

  it('maps malformed JSON shape to UpstreamBadResponseError', async () => {
    httpGet.mockReturnValue(
      of({
        data: [{ country: 'Brazil' }],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: axiosConfig,
      }),
    );

    await expect(client.fetchByCountry('Brazil')).rejects.toBeInstanceOf(
      UpstreamBadResponseError,
    );
  });

  it('maps network failure to UpstreamUnavailableError', async () => {
    const networkError = new AxiosError('network');
    networkError.code = 'ENOTFOUND';

    httpGet.mockReturnValue(throwError(() => networkError));

    await expect(client.fetchByCountry('Brazil')).rejects.toBeInstanceOf(
      UpstreamUnavailableError,
    );
  });

  it('rejects invalid date before HTTP call', async () => {
    await expect(client.fetchByDate('not-a-date')).rejects.toBeInstanceOf(
      UpstreamInvalidParamsError,
    );
    expect(httpGet).not.toHaveBeenCalled();
  });
});
