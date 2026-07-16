import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorResponseDto } from '../errors/error-response.dto';
import {
  CountryNotFoundException,
  InvalidCountryCodeException,
  SyncAlreadyRunningException,
} from '../errors/domain.exceptions';

function firstJsonBody(json: jest.Mock): ErrorResponseDto {
  const args = json.mock.calls[0] as unknown[] | undefined;
  if (!args?.[0] || typeof args[0] !== 'object') {
    throw new Error('Expected filter to call response.json with an object');
  }
  return args[0] as ErrorResponseDto;
}

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  function createHost(url = '/covid/countries/ZZ'): {
    host: ArgumentsHost;
    json: jest.Mock;
    status: jest.Mock;
  } {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    // Mimic Express: path without query; url may include query.
    const pathOnly = url.includes('?') ? url.slice(0, url.indexOf('?')) : url;
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url, path: pathOnly }),
      }),
    } as ArgumentsHost;

    return { host, json, status };
  }

  it('maps domain HttpException to the API_SPEC §4.1 envelope', () => {
    const { host, json, status } = createHost('/covid/countries/ZZ');

    filter.catch(new CountryNotFoundException('ZZ'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    const body = firstJsonBody(json);
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 404,
        error: 'Not Found',
        message: "Country 'ZZ' not found",
        path: '/covid/countries/ZZ',
      }),
    );
    expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('maps SyncAlreadyRunningException → 409', () => {
    const { host, json, status } = createHost('/sync');

    filter.catch(new SyncAlreadyRunningException(), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(firstJsonBody(json)).toEqual(
      expect.objectContaining({
        statusCode: 409,
        error: 'Conflict',
        message: 'A sync is already running',
      }),
    );
  });

  it('maps InvalidCountryCodeException → 400', () => {
    const { host, json, status } = createHost('/covid/countries/zz');

    filter.catch(new InvalidCountryCodeException('zz'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(firstJsonBody(json).message).toContain('zz');
  });

  it('joins ValidationPipe message arrays into a single string', () => {
    const { host, json, status } = createHost('/demo');
    const exception = new HttpException(
      { message: ['field must be a string', 'field should not be empty'] },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(status).toHaveBeenCalledWith(400);
    const body = firstJsonBody(json);
    expect(body.message).toBe(
      'field must be a string; field should not be empty',
    );
    expect(body.error).toBe('Bad Request');
  });

  it('accepts HttpException with a string body (4xx)', () => {
    const { host, json } = createHost('/x');
    filter.catch(
      new HttpException('plain message', HttpStatus.BAD_REQUEST),
      host,
    );
    expect(firstJsonBody(json).message).toBe('plain message');
  });

  it('returns a generic 500 for unknown Error — no secret or stack', () => {
    const { host, json, status } = createHost('/boom');

    filter.catch(new Error('secret db password leaked'), host);

    expect(status).toHaveBeenCalledWith(500);
    const body = firstJsonBody(json);
    expect(body).toEqual(
      expect.objectContaining({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'Internal server error',
        path: '/boom',
      }),
    );
    expect(JSON.stringify(body)).not.toContain('secret');
    expect(body).not.toHaveProperty('stack');
  });

  it('HttpException 500 does not leak internal message in the body', () => {
    const { host, json, status } = createHost('/fail');

    filter.catch(
      new InternalServerErrorException(
        'connection string postgresql://user:pass@host/db',
      ),
      host,
    );

    expect(status).toHaveBeenCalledWith(500);
    const body = firstJsonBody(json);
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('postgresql');
    expect(JSON.stringify(body)).not.toContain('pass');
    expect(body).not.toHaveProperty('stack');
  });

  it('envelope path does not include query string', () => {
    const { host, json } = createHost('/covid/series?token=secret-token&x=1');

    filter.catch(new CountryNotFoundException('ZZ'), host);

    const body = firstJsonBody(json);
    expect(body.path).toBe('/covid/series');
    expect(JSON.stringify(body)).not.toContain('secret-token');
  });

  it('503 ServiceUnavailable keeps the controlled operational message', () => {
    const { host, json, status } = createHost('/health');
    filter.catch(
      new HttpException('Database unreachable', HttpStatus.SERVICE_UNAVAILABLE),
      host,
    );

    expect(status).toHaveBeenCalledWith(503);
    expect(firstJsonBody(json)).toEqual(
      expect.objectContaining({
        statusCode: 503,
        error: 'Service Unavailable',
        message: 'Database unreachable',
      }),
    );
  });
});
