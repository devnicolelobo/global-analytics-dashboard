import { Injectable } from '@nestjs/common';
import { CountryNotFoundException } from '../common/errors';
import {
  MetricFields,
  pickMetricValue,
  rollupCountryMetrics,
  rollupGlobalMetrics,
  rollupSeriesByDate,
  toIsoDateOnly,
} from './aggregation';
import { CovidQueryService, MetricQueryRow } from './covid-query.service';
import {
  CountriesResponseDto,
  CountryDetailResponseDto,
  CountryListItemDto,
  CountryRefDto,
  CountrySeriesResponseDto,
  DEFAULT_METRIC,
  GlobalSeriesResponseDto,
  MetricType,
  MetricsSnapshotDto,
  SeriesPointDto,
  SummaryResponseDto,
} from './dto';

const DATA_SOURCE = 'api-ninjas';

/**
 * COVID read orchestration (API_SPEC §6 + §8).
 * Uses CovidQueryService for Prisma I/O and pure helpers for roll-up.
 * Never exposes subnational rows in responses.
 */
@Injectable()
export class CovidService {
  constructor(private readonly covidQuery: CovidQueryService) {}

  /** GET /covid/summary — global KPI aggregates (API_SPEC §6.2). */
  async getSummary(): Promise<SummaryResponseDto> {
    const [referenceDate, lastSuccessfulSyncAt] = await Promise.all([
      this.covidQuery.findLatestReferenceDate(),
      this.covidQuery.findLastSuccessfulSyncAt(),
    ]);

    const dto = new SummaryResponseDto();
    dto.scope = 'global';
    dto.meta = {
      lastSuccessfulSyncAt: toIsoOrNull(lastSuccessfulSyncAt),
      dataSource: DATA_SOURCE,
    };

    if (!referenceDate) {
      dto.referenceDate = null;
      dto.metrics = null;
      return dto;
    }

    const rows = await this.covidQuery.findMetricsForDate(referenceDate);
    const rolled = rollupGlobalMetrics(rows);

    dto.referenceDate = toIsoDateOnly(referenceDate);
    dto.metrics = rolled ? MetricsSnapshotDto.from(rolled) : null;
    return dto;
  }

  /**
   * GET /covid/countries — latest snapshot per country, sorted by metric
   * (API_SPEC §6.3).
   */
  async getCountries(
    metric: MetricType = DEFAULT_METRIC,
  ): Promise<CountriesResponseDto> {
    const [countries, referenceDate, lastSuccessfulSyncAt] = await Promise.all([
      this.covidQuery.findAllCountries(),
      this.covidQuery.findLatestReferenceDate(),
      this.covidQuery.findLastSuccessfulSyncAt(),
    ]);

    const metricsByCode = new Map<string, MetricsSnapshotDto | null>();

    if (referenceDate) {
      const rows = await this.covidQuery.findMetricsForDate(referenceDate);
      const byCountry = groupByCountry(rows);

      for (const [code, countryRows] of byCountry) {
        const rolled = rollupCountryMetrics(countryRows);
        metricsByCode.set(
          code,
          rolled ? MetricsSnapshotDto.from(rolled) : null,
        );
      }
    }

    const list: CountryListItemDto[] = countries.map((country) =>
      CountryListItemDto.from(
        CountryRefDto.from(country.iso2, country.name),
        metricsByCode.get(country.iso2) ?? null,
      ),
    );

    list.sort((a, b) => compareByMetric(a.metrics, b.metrics, metric));

    const dto = new CountriesResponseDto();
    dto.referenceDate = referenceDate ? toIsoDateOnly(referenceDate) : null;
    dto.countries = list;
    dto.meta = {
      count: list.length,
      lastSuccessfulSyncAt: toIsoOrNull(lastSuccessfulSyncAt),
    };
    return dto;
  }

  /** GET /covid/countries/:countryCode — country detail (API_SPEC §6.4). */
  async getCountryDetail(
    countryCode: string,
  ): Promise<CountryDetailResponseDto> {
    const country = await this.requireCountry(countryCode);

    const [referenceDate, lastSuccessfulSyncAt, hasRegionalBreakdown] =
      await Promise.all([
        this.covidQuery.findLatestReferenceDateForCountry(countryCode),
        this.covidQuery.findLastSuccessfulSyncAt(),
        this.covidQuery.hasRegionalBreakdown(countryCode),
      ]);

    const dto = new CountryDetailResponseDto();
    dto.scope = 'country';
    dto.country = CountryRefDto.from(country.iso2, country.name);
    dto.meta = {
      hasRegionalBreakdown,
      lastSuccessfulSyncAt: toIsoOrNull(lastSuccessfulSyncAt),
    };

    if (!referenceDate) {
      dto.referenceDate = null;
      dto.metrics = null;
      return dto;
    }

    const rows = await this.covidQuery.findMetricsForCountryOnDate(
      countryCode,
      referenceDate,
    );
    const rolled = rollupCountryMetrics(rows);

    dto.referenceDate = toIsoDateOnly(referenceDate);
    dto.metrics = rolled ? MetricsSnapshotDto.from(rolled) : null;
    return dto;
  }

  /**
   * GET /covid/countries/:countryCode/series (API_SPEC §6.5).
   * Empty history → 200 with points: [].
   */
  async getCountrySeries(
    countryCode: string,
    metric: MetricType = DEFAULT_METRIC,
    from?: string,
    to?: string,
  ): Promise<CountrySeriesResponseDto> {
    const country = await this.requireCountry(countryCode);
    const rows = await this.covidQuery.findSeriesRows({
      countryCode,
      from,
      to,
    });

    const points = mapSeriesPoints(rows, metric, 'country');

    const dto = new CountrySeriesResponseDto();
    dto.scope = 'country';
    dto.country = CountryRefDto.from(country.iso2, country.name);
    dto.metric = metric;
    dto.points = points;
    dto.meta = {
      pointCount: points.length,
      from: from ?? firstDate(points),
      to: to ?? lastDate(points),
    };
    return dto;
  }

  /** GET /covid/series — global aggregated series (API_SPEC §6.6). */
  async getGlobalSeries(
    metric: MetricType = DEFAULT_METRIC,
    from?: string,
    to?: string,
  ): Promise<GlobalSeriesResponseDto> {
    const rows = await this.covidQuery.findSeriesRows({ from, to });
    const points = mapSeriesPoints(rows, metric, 'global');

    const dto = new GlobalSeriesResponseDto();
    dto.scope = 'global';
    dto.metric = metric;
    dto.points = points;
    dto.meta = {
      pointCount: points.length,
      from: from ?? firstDate(points),
      to: to ?? lastDate(points),
    };
    return dto;
  }

  private async requireCountry(
    countryCode: string,
  ): Promise<{ iso2: string; name: string }> {
    const country = await this.covidQuery.findCountryByCode(countryCode);
    if (!country) {
      throw new CountryNotFoundException(countryCode);
    }
    return country;
  }
}

function groupByCountry(
  rows: MetricQueryRow[],
): Map<string, MetricQueryRow[]> {
  const map = new Map<string, MetricQueryRow[]>();
  for (const row of rows) {
    const list = map.get(row.countryCode) ?? [];
    list.push(row);
    map.set(row.countryCode, list);
  }
  return map;
}

function mapSeriesPoints(
  rows: MetricQueryRow[],
  metric: MetricType,
  mode: 'country' | 'global',
): SeriesPointDto[] {
  return rollupSeriesByDate(rows, mode).map((point) =>
    SeriesPointDto.from(point.date, pickMetricValue(point.metrics, metric)),
  );
}

/**
 * Sort descending by selected metric; nulls last; stable by leaving equals as-is.
 */
function compareByMetric(
  a: MetricsSnapshotDto | null,
  b: MetricsSnapshotDto | null,
  metric: MetricType,
): number {
  const av = metricValue(a, metric);
  const bv = metricValue(b, metric);

  if (av === null && bv === null) {
    return 0;
  }
  if (av === null) {
    return 1;
  }
  if (bv === null) {
    return -1;
  }
  return bv - av;
}

function metricValue(
  snapshot: MetricsSnapshotDto | null,
  metric: MetricType,
): number | null {
  if (!snapshot) {
    return null;
  }
  return pickMetricValue(snapshot as MetricFields, metric);
}

function toIsoOrNull(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function firstDate(points: SeriesPointDto[]): string | null {
  return points.length > 0 ? points[0].date : null;
}

function lastDate(points: SeriesPointDto[]): string | null {
  return points.length > 0 ? points[points.length - 1].date : null;
}
