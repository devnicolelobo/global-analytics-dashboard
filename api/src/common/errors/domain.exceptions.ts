import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

/** Unknown country code in the countries table (API_SPEC §4.2 — 404). */
export class CountryNotFoundException extends NotFoundException {
  constructor(countryCode: string) {
    super(`Country '${countryCode}' not found`);
  }
}

/** Sync already in progress (API_SPEC §4.2 — 409). */
export class SyncAlreadyRunningException extends ConflictException {
  constructor() {
    super('A sync is already running');
  }
}

/** Malformed or non-ISO2 country code (API_SPEC §4.2 — 400). */
export class InvalidCountryCodeException extends BadRequestException {
  constructor(countryCode: string) {
    super(
      `Invalid country code '${countryCode}': expected uppercase ISO 3166-1 alpha-2`,
    );
  }
}
