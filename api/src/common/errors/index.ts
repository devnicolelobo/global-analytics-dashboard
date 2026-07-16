/**
 * Public barrel for API errors.
 * Prefer: `import { CountryNotFoundException } from '../common/errors'`.
 */
export type { ErrorResponseDto } from './error-response.dto';
export {
  CountryNotFoundException,
  InvalidCountryCodeException,
  SyncAlreadyRunningException,
} from './domain.exceptions';
export { HttpExceptionFilter } from '../filters/http-exception.filter';
