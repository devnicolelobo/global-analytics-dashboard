/**
 * Pure aggregation helpers for COVID read models (API_SPEC §8).
 * Prefer national row (`region === ""`); otherwise sum regional rows.
 * Never expose subnational rows in API responses.
 */

export interface MetricFields {
  casesTotal: number | null;
  deathsTotal: number | null;
  casesNew: number | null;
  deathsNew: number | null;
}

export interface RegionMetricRow extends MetricFields {
  region: string;
}

export interface CountryDateMetricRow extends MetricFields {
  countryCode: string;
  region: string;
  referenceDate: Date;
}

/**
 * Sum nullable metric columns (API_SPEC §8.1).
 * Treat null as 0 for the sum unless every value is null → return null.
 */
export function sumNullable(values: Array<number | null>): number | null {
  if (values.length === 0) {
    return null;
  }
  if (values.every((value) => value === null)) {
    return null;
  }
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

/** Sum each metric field across rows using null-as-0 / all-null rules. */
export function sumMetricFields(rows: MetricFields[]): MetricFields {
  return {
    casesTotal: sumNullable(rows.map((row) => row.casesTotal)),
    deathsTotal: sumNullable(rows.map((row) => row.deathsTotal)),
    casesNew: sumNullable(rows.map((row) => row.casesNew)),
    deathsNew: sumNullable(rows.map((row) => row.deathsNew)),
  };
}

function pickMetrics(row: MetricFields): MetricFields {
  return {
    casesTotal: row.casesTotal,
    deathsTotal: row.deathsTotal,
    casesNew: row.casesNew,
    deathsNew: row.deathsNew,
  };
}

/**
 * Country roll-up for one country on one date (API_SPEC §8.2).
 * - National row (`region === ""`) wins when present.
 * - Otherwise sum all regional rows.
 * - Empty input → null metrics object fields via empty sum → all null.
 */
export function rollupCountryMetrics(
  rows: RegionMetricRow[],
): MetricFields | null {
  if (rows.length === 0) {
    return null;
  }

  const national = rows.find((row) => row.region === '');
  if (national) {
    return pickMetrics(national);
  }

  return sumMetricFields(rows);
}

/**
 * Global roll-up: per-country roll-up first, then sum countries (API_SPEC §8.1).
 */
export function rollupGlobalMetrics(
  rows: Array<
    CountryDateMetricRow | (RegionMetricRow & { countryCode: string })
  >,
): MetricFields | null {
  if (rows.length === 0) {
    return null;
  }

  const byCountry = new Map<string, RegionMetricRow[]>();
  for (const row of rows) {
    const list = byCountry.get(row.countryCode) ?? [];
    list.push(row);
    byCountry.set(row.countryCode, list);
  }

  const countryMetrics: MetricFields[] = [];
  for (const countryRows of byCountry.values()) {
    const rolled = rollupCountryMetrics(countryRows);
    if (rolled) {
      countryMetrics.push(rolled);
    }
  }

  if (countryMetrics.length === 0) {
    return null;
  }

  return sumMetricFields(countryMetrics);
}

/** Format Prisma `@db.Date` as YYYY-MM-DD (UTC calendar date). */
export function toIsoDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * Group rows by referenceDate (ISO date), then roll up each day.
 * Used for country series (one country) and as a building block for global series.
 */
export function rollupSeriesByDate(
  rows: CountryDateMetricRow[],
  mode: 'country' | 'global',
): Array<{ date: string; metrics: MetricFields }> {
  const byDate = new Map<string, CountryDateMetricRow[]>();

  for (const row of rows) {
    const date = toIsoDateOnly(row.referenceDate);
    const list = byDate.get(date) ?? [];
    list.push(row);
    byDate.set(date, list);
  }

  const dates = [...byDate.keys()].sort();
  const points: Array<{ date: string; metrics: MetricFields }> = [];

  for (const date of dates) {
    const dayRows = byDate.get(date) ?? [];
    const metrics =
      mode === 'global'
        ? rollupGlobalMetrics(dayRows)
        : rollupCountryMetrics(dayRows);

    if (metrics) {
      points.push({ date, metrics });
    }
  }

  return points;
}

/** Pick a single metric column from a snapshot. */
export function pickMetricValue(
  metrics: MetricFields,
  metric: keyof MetricFields,
): number | null {
  return metrics[metric];
}
