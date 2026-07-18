import {
  IsIn,
  IsOptional,
  Matches,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import {
  DEFAULT_METRIC,
  METRIC_TYPES,
  MetricType,
} from './metric-type';

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

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
 * Shared query params for series endpoints (API_SPEC §6.5–6.6).
 */
export class SeriesQueryDto {
  @IsOptional()
  @IsIn(METRIC_TYPES, {
    message: `metric must be one of: ${METRIC_TYPES.join(', ')}`,
  })
  metric?: MetricType = DEFAULT_METRIC;

  @IsOptional()
  @Matches(ISO_DATE, {
    message: 'from must be a date in YYYY-MM-DD format',
  })
  @Validate(FromBeforeToConstraint)
  from?: string;

  @IsOptional()
  @Matches(ISO_DATE, {
    message: 'to must be a date in YYYY-MM-DD format',
  })
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
