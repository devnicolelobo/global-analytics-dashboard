/**
 * Domain-shaped DTOs produced by MetricNormalizer and consumed by CovidMetricRepository.
 * @see docs/DATA_MODEL.md §5–6 · docs/EXTERNAL_APIS.md §4
 */

/** Metric fields that may arrive from separate cases/deaths upstream calls. */
export interface NormalizedMetricFields {
  casesTotal?: number | null;
  casesNew?: number | null;
  deathsTotal?: number | null;
  deathsNew?: number | null;
}

/**
 * One flat persistence-ready row.
 * - region is always a string ("" when national) — never null (DATA_MODEL §5.1)
 * - case/death fields are optional so cases and deaths passes can merge on the same natural key
 */
export interface NormalizedMetricInput extends NormalizedMetricFields {
  countryCode: string;
  countryName: string;
  upstreamName: string;
  region: string;
  referenceDate: string; // YYYY-MM-DD — repository coerces to Date
  source: 'api-ninjas';
}

/** Result of normalizing a batch — includes skip stats for ingest observability. */
export interface NormalizeBatchResult {
  metrics: NormalizedMetricInput[];
  skippedUnmappedCountries: string[];
  skippedInvalidDates: number;
}

/** Country catalogue entry resolved during normalization. */
export interface ResolvedCountry {
  iso2: string;
  name: string;
  upstreamName: string;
}
