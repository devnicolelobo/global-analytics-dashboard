import { HttpStatus } from '@nestjs/common';
import {
  CountryNotFoundException,
  InvalidCountryCodeException,
  SyncAlreadyRunningException,
} from './domain.exceptions';

describe('domain exceptions', () => {
  it('CountryNotFoundException → 404 with code in message', () => {
    const ex = new CountryNotFoundException('ZZ');
    expect(ex.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(ex.message).toContain('ZZ');
  });

  it('SyncAlreadyRunningException → 409', () => {
    const ex = new SyncAlreadyRunningException();
    expect(ex.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(ex.message).toContain('already running');
  });

  it('InvalidCountryCodeException → 400', () => {
    const ex = new InvalidCountryCodeException('bra');
    expect(ex.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    expect(ex.message).toContain('bra');
    expect(ex.message).toContain('ISO 3166-1');
  });
});
