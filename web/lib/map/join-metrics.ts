/**
 * ISO2 join helpers — map GeoJSON country polygons to API country rows (DATA_MODEL §7.4).
 *
 * Pure functions only. GeoJSON properties and API JSON are untrusted: validate ISO2 shape
 * via shared country-code guard before using codes in selection or tooltips.
 */
import type { CountryListItem } from '@/lib/api/types';
import { normalizeCountryCodeInput } from '@/lib/country-code';

import type { CountryFeature, CountryGeoJsonProperties, MapMetric } from './types';
import { GEOJSON_ISO2_PROPERTY } from './types';

/** Lookup table keyed by validated uppercase ISO2. */
export type CountryListLookup = ReadonlyMap<string, CountryListItem>;

/**
 * Extract ISO 3166-1 alpha-2 from GeoJSON feature properties.
 * Tries `ISO_A2` then `iso_a2`; rejects invalid shape (including "-99" sentinel strings).
 */
export function parseGeoJsonIso2(
  properties: CountryGeoJsonProperties | null | undefined,
): string | null {
  if (properties === null || properties === undefined) {
    return null;
  }

  const candidates = [
    properties[GEOJSON_ISO2_PROPERTY],
    properties.iso_a2,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') {
      continue;
    }
    const normalized = normalizeCountryCodeInput(candidate.trim().toUpperCase());
    if (normalized !== null) {
      return normalized;
    }
  }

  return null;
}

/** Build ISO2 → country row map; skips rows with invalid API codes. */
export function buildCountryListLookup(
  countries: ReadonlyArray<CountryListItem>,
): CountryListLookup {
  const lookup = new Map<string, CountryListItem>();

  for (const country of countries) {
    const code = normalizeCountryCodeInput(country.code);
    if (code === null) {
      continue;
    }
    lookup.set(code, country);
  }

  return lookup;
}

/** Resolve API row for a GeoJSON feature via ISO2 join key. */
export function joinFeatureToCountry(
  feature: CountryFeature,
  lookup: CountryListLookup,
): CountryListItem | null {
  const iso2 = parseGeoJsonIso2(feature.properties);
  if (iso2 === null) {
    return null;
  }
  return lookup.get(iso2) ?? null;
}

/** Read choropleth metric from a country row; missing row → null (no-data styling). */
export function getMapMetricValue(
  country: CountryListItem | null | undefined,
  metric: MapMetric,
): number | null {
  if (country === null || country === undefined) {
    return null;
  }

  const value = country.metrics[metric];
  if (value === null || value === undefined || Number.isNaN(value)) {
    return null;
  }

  return value;
}

/** Collect metric values for extent/legend from the API list (ignores invalid codes). */
export function collectMetricValues(
  countries: ReadonlyArray<CountryListItem>,
  metric: MapMetric,
): number[] {
  const values: number[] = [];

  for (const country of countries) {
    const value = getMapMetricValue(country, metric);
    if (value !== null) {
      values.push(value);
    }
  }

  return values;
}
