import { Controller, Get, Param, Query } from '@nestjs/common';
import { InvalidCountryCodeException } from '../common/errors';
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

/** Uppercase ISO 3166-1 alpha-2 only — lowercase → 400 (API_SPEC §4.3). */
const ISO2_UPPERCASE = /^[A-Z]{2}$/;

/**
 * COVID read HTTP surface (API_SPEC §6.2–6.6).
 * Routing + DTO validation only; business rules live in CovidService.
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

  /** Global time series (must be registered before :countryCode routes). */
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

  /** Single-country latest snapshot. */
  @Get('countries/:countryCode')
  getCountryDetail(
    @Param('countryCode') countryCode: string,
  ): Promise<CountryDetailResponseDto> {
    assertUppercaseIso2(countryCode);
    return this.covidService.getCountryDetail(countryCode);
  }

  /** Country-scoped time series. */
  @Get('countries/:countryCode/series')
  getCountrySeries(
    @Param('countryCode') countryCode: string,
    @Query() query: SeriesQueryDto,
  ): Promise<CountrySeriesResponseDto> {
    assertUppercaseIso2(countryCode);
    return this.covidService.getCountrySeries(
      countryCode,
      query.metric ?? DEFAULT_METRIC,
      query.from,
      query.to,
    );
  }
}

function assertUppercaseIso2(countryCode: string): void {
  if (!ISO2_UPPERCASE.test(countryCode)) {
    throw new InvalidCountryCodeException(countryCode);
  }
}
