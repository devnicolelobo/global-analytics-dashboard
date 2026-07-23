/**
 * Map layer types for DEV-92 choropleth (ADR-005).
 *
 * Pure type/constants module — no Leaflet imports so helpers stay testable in Node.
 * GeoJSON join uses ISO_A2 on polygon features ↔ API CountryListItem.code (DATA_MODEL §7.4).
 */
import type { Metric } from '@/lib/api/types';

/** Metrics supported for choropleth coloring in MVP (REQ-F-21). */
export type MapMetric = Extract<
  Metric,
  'casesTotal' | 'deathsTotal' | 'casesNew'
>;

/** Default choropleth field — API_SPEC §6.3 / §9.4. */
export const DEFAULT_MAP_METRIC: MapMetric = 'casesTotal';

/**
 * Static simplified world countries GeoJSON served from `web/public/`.
 * Natural Earth 110m Admin 0 – Countries (public domain) — see asset comment in PR.
 */
export const COUNTRIES_GEOJSON_PATH = '/geo/countries-110m.geojson';

/**
 * Property name on GeoJSON features used to join API rows by ISO 3166-1 alpha-2.
 * Dataset ships `ISO_A2` (uppercase); join helper also accepts lowercase `iso_a2`.
 */
export const GEOJSON_ISO2_PROPERTY = 'ISO_A2' as const;

/** Known GeoJSON country polygon properties (untrusted — validate before join). */
export type CountryGeoJsonProperties = {
  [GEOJSON_ISO2_PROPERTY]?: string;
  iso_a2?: string;
  /** Fallback label from geometry file; tooltips prefer API `CountryListItem.name`. */
  NAME?: string;
  name?: string;
};

export type CountryFeature = GeoJSON.Feature<
  GeoJSON.Geometry,
  CountryGeoJsonProperties
>;

export type CountryFeatureCollection = GeoJSON.FeatureCollection<
  GeoJSON.Geometry,
  CountryGeoJsonProperties
>;
