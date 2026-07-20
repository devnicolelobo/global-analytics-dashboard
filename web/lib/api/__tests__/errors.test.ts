import { describe, expect, it } from 'vitest';
import {
  ApiError,
  parseErrorEnvelope,
  sanitizeErrorMessage,
} from '../errors';

describe('sanitizeErrorMessage', () => {
  it('strips HTML-like tags and control characters', () => {
    expect(sanitizeErrorMessage('<b>Not Found</b>')).toBe('Not Found');
    expect(sanitizeErrorMessage('Bad\u0000Request')).toBe('BadRequest');
  });

  it('falls back for non-string or empty values', () => {
    expect(sanitizeErrorMessage(null)).toBe('Unexpected error');
    expect(sanitizeErrorMessage('   ')).toBe('Unexpected error');
  });
});

describe('parseErrorEnvelope', () => {
  it('maps a valid envelope fixture', () => {
    const envelope = parseErrorEnvelope({
      statusCode: 404,
      error: 'Not Found',
      message: "Country 'ZZ' not found",
      timestamp: '2026-07-08T18:30:00.000Z',
      path: '/covid/countries/ZZ',
    });

    expect(envelope).toEqual({
      statusCode: 404,
      error: 'Not Found',
      message: "Country 'ZZ' not found",
      timestamp: '2026-07-08T18:30:00.000Z',
      path: '/covid/countries/ZZ',
    });
  });

  it('returns null for non-objects or empty objects', () => {
    expect(parseErrorEnvelope(null)).toBeNull();
    expect(parseErrorEnvelope('oops')).toBeNull();
    expect(parseErrorEnvelope({})).toBeNull();
  });

  it('keeps only fields with the expected types', () => {
    expect(
      parseErrorEnvelope({
        statusCode: '404',
        message: 'Only this counts',
        path: 123,
      }),
    ).toEqual({ message: 'Only this counts' });
  });
});

describe('ApiError.fromHttpResponse', () => {
  it('builds an http ApiError from an envelope body', () => {
    const error = ApiError.fromHttpResponse(
      404,
      {
        statusCode: 404,
        error: 'Not Found',
        message: "Country 'ZZ' not found",
        timestamp: '2026-07-08T18:30:00.000Z',
        path: '/covid/countries/ZZ',
      },
      '/fallback',
    );

    expect(error).toBeInstanceOf(ApiError);
    expect(error.kind).toBe('http');
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Country 'ZZ' not found");
    expect(error.path).toBe('/covid/countries/ZZ');
  });

  it('falls back to status text when envelope message is missing', () => {
    const error = ApiError.fromHttpResponse(500, null, '/covid/summary');
    expect(error.kind).toBe('http');
    expect(error.statusCode).toBe(500);
    expect(error.message).toMatch(/status 500/);
    expect(error.path).toBe('/covid/summary');
  });
});

describe('ApiError factories', () => {
  it('creates network, parse, timeout, and abort kinds', () => {
    expect(ApiError.network().kind).toBe('network');
    expect(ApiError.parse().kind).toBe('parse');
    expect(ApiError.timeout(1000).kind).toBe('timeout');
    expect(ApiError.aborted().kind).toBe('abort');
  });
});
