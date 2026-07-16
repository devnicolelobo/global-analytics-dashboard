import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/**
 * Shared Nest bootstrap wiring.
 * Used by `main.ts` and e2e so production and tests behave the same:
 * - global error filter (API_SPEC envelope)
 * - strict ValidationPipe (whitelist + forbidNonWhitelisted + transform)
 */
export function configureApp(app: INestApplication): void {
  app.enableShutdownHooks();
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      // Strip properties not declared on the DTO.
      whitelist: true,
      // Reject requests with extra fields (400) instead of silently stripping.
      forbidNonWhitelisted: true,
      // Coerce types (e.g. query string → number) per DTO metadata.
      transform: true,
    }),
  );
}
