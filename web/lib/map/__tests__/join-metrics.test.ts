import { describe, expect, it } from 'vitest';

import type { CountryListItem } from '@/lib/api/types';

import {
  buildCountryListLookup,
  collectMetricValues,
  getMapMetricValue,
  joinFeatureToCountry,
  parseGeoJsonIso2,
} from '../join-metrics';
import type { CountryFeature } from '../types';

const brRow: CountryListItem = {
  code: 'BR',
  name: 'Brazil',
  metrics: {
    casesTotal: 100,
    deathsTotal: 10,
    casesNew: 1,
  },
};

const usRow: CountryListItem = {
  code: 'US',
  name: 'United States',
  metrics: {
    casesTotal: 200,
    deathsTotal: null,
    casesNew: 5,
  },
};

function featureWithIso2(iso2: string): CountryFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [] },
    properties: { ISO_A2: iso2, NAME: 'Example' },
  };
}

describe('parseGeoJsonIso2', () => {
  it('reads uppercase ISO_A2 property', () => {
    expect(parseGeoJsonIso2({ ISO_A2: 'BR' })).toBe('BR');
  });

  it('reads lowercase iso_a2 property', () => {
    expect(parseGeoJsonIso2({ iso_a2: 'us' })).toBe('US');
  });

  it('rejects invalid or missing codes', () => {
    expect(parseGeoJsonIso2(null)).toBeNull();
    expect(parseGeoJsonIso2({ ISO_A2: '-99' })).toBeNull();
    expect(parseGeoJsonIso2({ ISO_A2: 'BRA' })).toBeNull();
    expect(parseGeoJsonIso2({})).toBeNull();
  });
});

describe('buildCountryListLookup', () => {
  it('indexes rows by validated ISO2 code', () => {
    const lookup = buildCountryListLookup([brRow, usRow]);
    expect(lookup.get('BR')).toEqual(brRow);
    expect(lookup.get('US')).toEqual(usRow);
  });

  it('skips rows with invalid API codes', () => {
    const lookup = buildCountryListLookup([
      brRow,
      { ...usRow, code: 'invalid' },
    ]);
    expect(lookup.size).toBe(1);
    expect(lookup.has('US')).toBe(false);
  });
});

describe('joinFeatureToCountry', () => {
  it('returns matching API row for a feature ISO2', () => {
    const lookup = buildCountryListLookup([brRow, usRow]);
    expect(joinFeatureToCountry(featureWithIso2('BR'), lookup)).toEqual(brRow);
  });

  it('returns null when feature or API row is missing', () => {
    const lookup = buildCountryListLookup([brRow]);
    expect(joinFeatureToCountry(featureWithIso2('DE'), lookup)).toBeNull();
    expect(
      joinFeatureToCountry(
        {
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [] },
          properties: {},
        },
        lookup,
      ),
    ).toBeNull();
  });
});

describe('getMapMetricValue', () => {
  it('returns metric value when present', () => {
    expect(getMapMetricValue(brRow, 'casesTotal')).toBe(100);
  });

  it('returns null for missing country or null metric', () => {
    expect(getMapMetricValue(null, 'casesTotal')).toBeNull();
    expect(getMapMetricValue(usRow, 'deathsTotal')).toBeNull();
  });
});

describe('collectMetricValues', () => {
  it('collects only finite metric values', () => {
    expect(collectMetricValues([brRow, usRow], 'casesTotal')).toEqual([
      100, 200,
    ]);
    expect(collectMetricValues([brRow, usRow], 'deathsTotal')).toEqual([10]);
  });
});
