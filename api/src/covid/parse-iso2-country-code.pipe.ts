import { PipeTransform, Injectable } from '@nestjs/common';
import { assertUppercaseIso2 } from './country-code';

/**
 * Nest pipe for `:countryCode` path params.
 * Keeps controllers free of inline validation and fails closed (400).
 */
@Injectable()
export class ParseIso2CountryCodePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    assertUppercaseIso2(value);
    return value;
  }
}
