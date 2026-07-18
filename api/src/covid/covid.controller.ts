import { Controller, Get, Param, Query } from '@nestjs/common';
import { CovidService } from './covid.service';
import {
  CountriesQueryDto,
  CountriesResponseDto,
  CountryDetailResponseDto,
  CountrySeriesResponseDto,
  DEFAULT_METRIC,
  GlobalSeriesResponseDto,
  SeriesQueryDto,
  SummaryResponseDto,
} from './dto';
import { ParseIso2CountryCodePipe } from './parse-iso2-country-code.pipe';

/**
 * COVID read HTTP surface (API_SPEC §6.2–6.6).
 *
 * Layering:
 * - Controller: routing + DTO / pipe validation only (no Prisma, no roll-up).
 * - CovidService: aggregation business rules.
 * - CovidQueryService: parameterized Prisma queries (injection-safe).
 *
 * Read-only — no write side effects. Auth is out of scope for MVP.
 */
@Controller('covid')
export class CovidController {
  constructor(private readonly covidService: CovidService) {}

  /** Global KPI aggregates when no country is selected. */
  @Get('summary')
  getSummary(): Promise<SummaryResponseDto> {
    return this.covidService.getSummary();
  }

  /** Country list with latest snapshot; optional ?metric= sort key. */
  @Get('countries')
  getCountries(
    @Query() query: CountriesQueryDto,
  ): Promise<CountriesResponseDto> {
    return this.covidService.getCountries(query.metric ?? DEFAULT_METRIC);
  }

  /**
   * Global time series.
   * Registered before `countries/:countryCode` so `/covid/series` is not captured
   * as a country code path segment.
   */
  @Get('series')
  getGlobalSeries(
    @Query() query: SeriesQueryDto,
  ): Promise<GlobalSeriesResponseDto> {
    return this.covidService.getGlobalSeries(
      query.metric ?? DEFAULT_METRIC,
      query.from,
      query.to,
    );
  }

  /** Single-country latest snapshot (404 if ISO2 unknown in `countries`). */
  @Get('countries/:countryCode')
  getCountryDetail(
    @Param('countryCode', ParseIso2CountryCodePipe) countryCode: string,
  ): Promise<CountryDetailResponseDto> {
    return this.covidService.getCountryDetail(countryCode);
  }

  /** Country-scoped time series (empty history → 200 + points: []). */
  @Get('countries/:countryCode/series')
  getCountrySeries(
    @Param('countryCode', ParseIso2CountryCodePipe) countryCode: string,
    @Query() query: SeriesQueryDto,
  ): Promise<CountrySeriesResponseDto> {
    return this.covidService.getCountrySeries(
      countryCode,
      query.metric ?? DEFAULT_METRIC,
      query.from,
      query.to,
    );
  }
}
