import { validate } from './env.validation';

describe('validate (environment)', () => {
  const validBase = {
    DATABASE_URL: 'postgresql://gad:gad@localhost:5432/global_analytics',
  };

  it('accepts a valid configuration with defaults', () => {
    const result = validate(validBase);

    expect(result).toEqual({
      DATABASE_URL: validBase.DATABASE_URL,
      PORT: 3001,
      NODE_ENV: 'development',
      API_NINJAS_KEY: undefined,
      API_NINJAS_TIMEOUT_MS: undefined,
    });
  });

  it('accepts explicit PORT, NODE_ENV, and API_NINJAS_KEY', () => {
    const result = validate({
      ...validBase,
      PORT: '4000',
      NODE_ENV: 'test',
      API_NINJAS_KEY: 'secret-key',
    });

    expect(result.PORT).toBe(4000);
    expect(result.NODE_ENV).toBe('test');
    expect(result.API_NINJAS_KEY).toBe('secret-key');
  });

  it('rejects missing DATABASE_URL', () => {
    expect(() => validate({})).toThrow('DATABASE_URL is required');
  });

  it('rejects malformed DATABASE_URL', () => {
    expect(() => validate({ DATABASE_URL: 'mysql://localhost/db' })).toThrow(
      'DATABASE_URL is malformed',
    );
  });

  it('rejects invalid PORT', () => {
    expect(() => validate({ ...validBase, PORT: 'not-a-port' })).toThrow(
      'PORT must be a valid integer',
    );
  });

  it('accepts explicit API_NINJAS_TIMEOUT_MS', () => {
    const result = validate({ ...validBase, API_NINJAS_TIMEOUT_MS: '20000' });
    expect(result.API_NINJAS_TIMEOUT_MS).toBe(20000);
  });

  it('rejects invalid API_NINJAS_TIMEOUT_MS', () => {
    expect(() =>
      validate({ ...validBase, API_NINJAS_TIMEOUT_MS: '500' }),
    ).toThrow('API_NINJAS_TIMEOUT_MS must be an integer');
  });
});
