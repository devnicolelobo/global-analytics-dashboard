/**
 * GeoJSON asset validation before passing geometry to Leaflet (DEV-92).
 *
 * Static file is trusted in normal ops, but treat fetch response as untrusted:
 * reject oversized payloads or malformed shapes to limit client-side DoS.
 */
import type { CountryFeatureCollection } from './types';

/** Natural Earth 110m ships ~170 features — cap headroom for simplified variants. */
export const MAX_GEOJSON_FEATURE_COUNT = 400;

/** Reject responses larger than 5 MB before JSON.parse. */
export const MAX_GEOJSON_BYTES = 5 * 1024 * 1024;

export function parseCountryFeatureCollection(
  body: unknown,
): CountryFeatureCollection | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }

  const record = body as Record<string, unknown>;
  if (record.type !== 'FeatureCollection') {
    return null;
  }

  if (!Array.isArray(record.features)) {
    return null;
  }

  if (
    record.features.length === 0 ||
    record.features.length > MAX_GEOJSON_FEATURE_COUNT
  ) {
    return null;
  }

  return body as CountryFeatureCollection;
}

/** Guard raw text size before parsing JSON from network or cache. */
export function isGeoJsonPayloadWithinSizeLimit(rawText: string): boolean {
  return rawText.length <= MAX_GEOJSON_BYTES;
}
