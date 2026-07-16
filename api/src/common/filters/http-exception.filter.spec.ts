import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import { ErrorResponseDto } from '../errors/error-response.dto';
import { CountryNotFoundException } from '../errors/domain.exceptions';

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
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status }),
        getRequest: () => ({ url }),
      }),
    } as ArgumentsHost;

    return { host, json, status };
  }

  it('maps HttpException to the API_SPEC §4.1 envelope', () => {
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

  it('returns a generic 500 message for unknown errors', () => {
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
});
