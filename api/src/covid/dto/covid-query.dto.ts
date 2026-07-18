import {
  IsIn,
  IsOptional,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  inclusiveDaySpan,
  isValidIsoDateOnly,
  MAX_SERIES_SPAN_DAYS,
} from '../iso-date';
import { DEFAULT_METRIC, METRIC_TYPES, MetricType } from './metric-type';

/**
 * Rejects non-calendar dates that still match YYYY-MM-DD (e.g. 2020-02-30).
 * Medical dashboards must not silently coerce overflow dates.
 */
@ValidatorConstraint({ name: 'isoDateOnly', async: false })
class IsoDateOnlyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (value === undefined || value === null || value === '') {
      return true;
    }
    return typeof value === 'string' && isValidIsoDateOnly(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be a valid calendar date in YYYY-MM-DD format`;
  }
}

@ValidatorConstraint({ name: 'fromBeforeTo', async: false })
class FromBeforeToConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as SeriesQueryDto;
    if (!obj.from || !obj.to) {
      return true;
    }
    return obj.from <= obj.to;
  }

  defaultMessage(): string {
    return 'from must be less than or equal to to';
  }
}

/**
 * Caps inclusive span to protect PostgreSQL / Node memory on series reads.
 * Full MVP COVID history fits well under MAX_SERIES_SPAN_DAYS.
 */
@ValidatorConstraint({ name: 'seriesDateSpan', async: false })
class SeriesDateSpanConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments): boolean {
    const obj = args.object as SeriesQueryDto;
    if (!obj.from || !obj.to) {
      return true;
    }
    if (!isValidIsoDateOnly(obj.from) || !isValidIsoDateOnly(obj.to)) {
      return true; // Let IsoDateOnlyConstraint report the format/calendar error.
    }
    if (obj.from > obj.to) {
      return true; // Let FromBeforeToConstraint report ordering.
    }
    return inclusiveDaySpan(obj.from, obj.to) <= MAX_SERIES_SPAN_DAYS;
  }

  defaultMessage(): string {
    return `date range must not exceed ${MAX_SERIES_SPAN_DAYS} days (inclusive)`;
  }
}

/**
 * Shared query params for series endpoints (API_SPEC §6.5–6.6).
 * All filters are optional; empty history remains a valid 200 + [].
 */
export class SeriesQueryDto {
  @IsOptional()
  @IsIn(METRIC_TYPES, {
    message: `metric must be one of: ${METRIC_TYPES.join(', ')}`,
  })
  metric?: MetricType = DEFAULT_METRIC;

  @IsOptional()
  @Validate(IsoDateOnlyConstraint)
  @Validate(FromBeforeToConstraint)
  @Validate(SeriesDateSpanConstraint)
  from?: string;

  @IsOptional()
  @Validate(IsoDateOnlyConstraint)
  to?: string;
}

/**
 * Optional sort key for GET /covid/countries (API_SPEC §6.3).
 */
export class CountriesQueryDto {
  @IsOptional()
  @IsIn(METRIC_TYPES, {
    message: `metric must be one of: ${METRIC_TYPES.join(', ')}`,
  })
  metric?: MetricType = DEFAULT_METRIC;
}
