import { describe, expect, it } from 'vitest';

import {
  isIsoDateString,
  sanitizeDisplayText,
} from '../sanitize-display';

describe('sanitizeDisplayText', () => {
  it('returns trimmed plain text', () => {
    expect(sanitizeDisplayText('  Brazil  ')).toBe('Brazil');
  });

  it('strips HTML-like tags and control characters', () => {
    expect(sanitizeDisplayText('Br<script>azil')).toBe('Brazil');
    expect(sanitizeDisplayText('B\u0000R')).toBe('BR');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeDisplayText(null)).toBe('');
    expect(sanitizeDisplayText(42)).toBe('');
  });

  it('truncates overly long strings', () => {
    expect(sanitizeDisplayText('A'.repeat(200)).length).toBe(120);
  });
});

describe('isIsoDateString', () => {
  it('accepts YYYY-MM-DD only', () => {
    expect(isIsoDateString('2024-06-15')).toBe(true);
    expect(isIsoDateString('2024-6-15')).toBe(false);
    expect(isIsoDateString('not-a-date')).toBe(false);
  });
});
