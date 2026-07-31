import { describe, expect, it } from 'vitest';

import { formatCountryExplorerResultCopy } from '../format-country-explorer-result';

describe('formatCountryExplorerResultCopy', () => {
  it('reports empty API list', () => {
    expect(formatCountryExplorerResultCopy(0, 0, '')).toBe(
      'No countries available',
    );
  });

  it('reports full list when query is empty', () => {
    expect(formatCountryExplorerResultCopy(196, 196, '')).toBe(
      'Showing all 196 countries',
    );
  });

  it('reports filtered counts', () => {
    expect(formatCountryExplorerResultCopy(1, 196, 'peru')).toBe(
      'Showing 1 of 196 countries',
    );
  });

  it('sanitizes query in no-match copy', () => {
    expect(formatCountryExplorerResultCopy(0, 196, '<script>x</script>')).toBe(
      'No countries match “x”',
    );
  });

  it('trims query in no-match copy', () => {
    expect(formatCountryExplorerResultCopy(0, 196, '  zzz  ')).toBe(
      'No countries match “zzz”',
    );
  });
});
