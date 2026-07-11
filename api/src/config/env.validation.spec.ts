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
});
