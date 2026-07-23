import { resolveCorsOrigins } from './configure-app';

describe('resolveCorsOrigins', () => {
  const previous = process.env.CORS_ORIGIN;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.CORS_ORIGIN;
    } else {
      process.env.CORS_ORIGIN = previous;
    }
  });

  it('defaults to local Next.js dev origins', () => {
    delete process.env.CORS_ORIGIN;
    expect(resolveCorsOrigins()).toEqual([
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ]);
  });

  it('parses comma-separated CORS_ORIGIN', () => {
    process.env.CORS_ORIGIN =
      'http://localhost:3000, https://staging.example.com';
    expect(resolveCorsOrigins()).toEqual([
      'http://localhost:3000',
      'https://staging.example.com',
    ]);
  });
});
