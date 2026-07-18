import { PrismaService } from '../../src/prisma/prisma.service';
import { assertPostgresDatabaseUrl } from './env';

/**
 * PostgreSQL helpers for integration/e2e (Option A — real DB, ADR-003).
 *
 * Robustness:
 * - Isolation via TRUNCATE so suites do not depend on execution order.
 * - Soft-skip probe (`isDatabaseReachable`) for laptops without Docker.
 *
 * Security / Prisma:
 * - Prefer tagged `$executeRaw` (no string concatenation / injection surface).
 * - Never log DATABASE_URL (credentials).
 */

/** Connect and cheap liveness check — throw on failure. */
export async function connectPrisma(prisma: PrismaService): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

/**
 * Wipe all MVP tables between tests.
 * CASCADE clears FK dependents; RESTART IDENTITY keeps serials deterministic.
 * Table names are fixed identifiers — never interpolate user input here.
 */
export async function truncateAllTables(prisma: PrismaService): Promise<void> {
  await prisma.$executeRaw`
    TRUNCATE TABLE
      covid_daily_metrics,
      sync_runs,
      countries
    RESTART IDENTITY CASCADE
  `;
}

export async function disconnectPrisma(prisma: PrismaService): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Probe whether Postgres is reachable without failing the whole Jest process.
 * Errors are swallowed (no URL / password in logs).
 */
export async function isDatabaseReachable(
  databaseUrl: string,
): Promise<boolean> {
  assertPostgresDatabaseUrl(databaseUrl);

  const previous = process.env.DATABASE_URL;
  process.env.DATABASE_URL = databaseUrl;
  // PrismaClient reads DATABASE_URL at construction time.
  const prisma = new PrismaService();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  } finally {
    await prisma.$disconnect().catch(() => undefined);
    if (previous === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previous;
    }
  }
}
