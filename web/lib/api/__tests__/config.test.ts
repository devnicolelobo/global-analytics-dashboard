import { afterEach, describe, expect, it } from 'vitest';
import {
  getApiBaseUrl,
  isValidApiBaseUrl,
  stripTrailingSlash,
} from '../config';

describe('stripTrailingSlash', () => {
  it('removes trailing slashes', () => {
    expect(stripTrailingSlash('http://localhost:3001/')).toBe(
      'http://localhost:3001',
    );
    expect(stripTrailingSlash('http://localhost:3001///')).toBe(
      'http://localhost:3001',
    );
  });

  it('leaves URLs without trailing slash unchanged', () => {
    expect(stripTrailingSlash('http://localhost:3001')).toBe(
      'http://localhost:3001',
    );
  });
});

describe('isValidApiBaseUrl', () => {
  it('accepts absolute http(s) URLs', () => {
    expect(isValidApiBaseUrl('http://localhost:3001')).toBe(true);
    expect(isValidApiBaseUrl('https://api.example.com')).toBe(true);
  });

  it('rejects relative paths and non-http schemes', () => {
    expect(isValidApiBaseUrl('/api')).toBe(false);
    expect(isValidApiBaseUrl('ftp://files.example.com')).toBe(false);
    expect(isValidApiBaseUrl('not a url')).toBe(false);
  });
});

describe('getApiBaseUrl', () => {
  afterEach(() => {
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  it('returns a normalized base URL when env is set', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/';
    expect(getApiBaseUrl()).toBe('http://localhost:3001');
  });

  it('throws when the env var is missing', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    expect(() => getApiBaseUrl()).toThrow(/NEXT_PUBLIC_API_URL/);
  });

  it('throws when the env var is not a valid http(s) URL', () => {
    process.env.NEXT_PUBLIC_API_URL = '/relative';
    expect(() => getApiBaseUrl()).toThrow(/Invalid NEXT_PUBLIC_API_URL/);
  });
});
