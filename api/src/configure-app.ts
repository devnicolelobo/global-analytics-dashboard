import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/** Default local Next.js origin — Phase 4 web/ integration (DEPLOYMENT.md). */
const DEFAULT_CORS_ORIGINS = ['http://localhost:3000'];

/**
 * Shared Nest bootstrap wiring.
 * Used by `main.ts` and e2e so production and tests behave the same:
 * - CORS for local web/ (and optional CORS_ORIGIN list)
 * - global error filter (API_SPEC envelope)
 * - strict ValidationPipe (whitelist + forbidNonWhitelisted + transform)
 */
export function configureApp(app: INestApplication): void {
  app.enableShutdownHooks();
  app.enableCors({
    origin: resolveCorsOrigins(),
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
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

/**
 * `CORS_ORIGIN` optional comma-separated list; falls back to localhost:3000.
 * Example: `CORS_ORIGIN=http://localhost:3000,https://staging.example.com`
 */
export function resolveCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN?.trim();
  if (!raw) {
    return [...DEFAULT_CORS_ORIGINS];
  }

  const origins = raw
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return origins.length > 0 ? origins : [...DEFAULT_CORS_ORIGINS];
}
