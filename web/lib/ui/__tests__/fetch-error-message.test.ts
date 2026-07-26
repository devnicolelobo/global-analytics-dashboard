import { describe, expect, it } from 'vitest';

import { ApiError } from '@/lib/api/errors';

import {
  DEFAULT_FETCH_ERROR_MESSAGE,
  toFetchErrorMessage,
} from '../fetch-error-message';

describe('toFetchErrorMessage', () => {
  it('uses ApiError message when present', () => {
    expect(
      toFetchErrorMessage(
        new ApiError('Network request failed', { kind: 'network' }),
      ),
    ).toBe('Network request failed');
  });

  it('sanitizes generic Error messages', () => {
    expect(toFetchErrorMessage(new Error('<b>bad</b>'))).toBe('bad');
  });

  it('falls back for unknown errors', () => {
    expect(toFetchErrorMessage(null)).toBe(DEFAULT_FETCH_ERROR_MESSAGE);
    expect(toFetchErrorMessage(undefined, 'Custom fallback')).toBe(
      'Custom fallback',
    );
  });
});
