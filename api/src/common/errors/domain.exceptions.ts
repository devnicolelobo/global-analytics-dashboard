import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

/**
 * Typed domain exceptions (API_SPEC §4.2).
 * Future controllers/services should throw these — the global filter
 * builds the envelope automatically. Do not hand-craft error JSON.
 */

/** Unknown country in the `countries` table → 404. */
export class CountryNotFoundException extends NotFoundException {
  constructor(countryCode: string) {
    super(`Country '${countryCode}' not found`);
  }
}

/** Sync already in progress → 409 Conflict. */
export class SyncAlreadyRunningException extends ConflictException {
  constructor() {
    super('A sync is already running');
  }
}

/**
 * Malformed country code (not uppercase ISO 3166-1 alpha-2) → 400.
 * Unlike CountryNotFoundException: format is invalid, not existence.
 */
export class InvalidCountryCodeException extends BadRequestException {
  constructor(countryCode: string) {
    super(
      `Invalid country code '${countryCode}': expected uppercase ISO 3166-1 alpha-2`,
    );
  }
}
