import { describe, expect, it } from 'vitest';

import {
  isGeoJsonPayloadWithinSizeLimit,
  MAX_GEOJSON_BYTES,
  MAX_GEOJSON_FEATURE_COUNT,
  parseCountryFeatureCollection,
} from '../validate-geojson';

describe('parseCountryFeatureCollection', () => {
  it('accepts a minimal valid FeatureCollection', () => {
    const body = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { ISO_A2: 'BR' },
          geometry: { type: 'Polygon', coordinates: [] },
        },
      ],
    };

    expect(parseCountryFeatureCollection(body)).toEqual(body);
  });

  it('rejects non-collections and empty feature lists', () => {
    expect(parseCountryFeatureCollection(null)).toBeNull();
    expect(parseCountryFeatureCollection({ type: 'Feature' })).toBeNull();
    expect(
      parseCountryFeatureCollection({ type: 'FeatureCollection', features: [] }),
    ).toBeNull();
  });

  it('rejects collections above feature cap', () => {
    const features = Array.from({ length: MAX_GEOJSON_FEATURE_COUNT + 1 }, () => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    }));

    expect(
      parseCountryFeatureCollection({
        type: 'FeatureCollection',
        features,
      }),
    ).toBeNull();
  });
});

describe('isGeoJsonPayloadWithinSizeLimit', () => {
  it('allows payloads within byte cap', () => {
    expect(isGeoJsonPayloadWithinSizeLimit('{"type":"FeatureCollection"}')).toBe(
      true,
    );
  });

  it('rejects payloads above byte cap', () => {
    expect(isGeoJsonPayloadWithinSizeLimit('x'.repeat(MAX_GEOJSON_BYTES + 1))).toBe(
      false,
    );
  });
});
