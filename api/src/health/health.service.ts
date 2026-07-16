import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Successful probe response (API_SPEC §6.1) — no internal details. */
export interface HealthOkResponse {
  status: 'ok';
  timestamp: string;
}

/** Readiness ping timeout — prevents the probe from hanging indefinitely. */
const DB_PING_TIMEOUT_MS = 3_000;

/**
 * Liveness + readiness: process up and database reachable.
 * Does not expose DATABASE_URL, internal hostnames, or connection details.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<HealthOkResponse> {
    await this.assertDatabaseReachable();
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness: `SELECT 1` raced against a timeout.
   * Failure or timeout → 503 with "Database unreachable" (via envelope).
   */
  private async assertDatabaseReachable(): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(
              new Error(
                `Database ping timed out after ${DB_PING_TIMEOUT_MS}ms`,
              ),
            );
          }, DB_PING_TIMEOUT_MS);
        }),
      ]);
    } catch (error: unknown) {
      // Do not log raw error.message — may contain connection string / host.
      const kind =
        error instanceof Error && /timed out/i.test(error.message)
          ? 'timeout'
          : 'unreachable';
      this.logger.warn(`Database readiness check failed (${kind})`);
      throw new ServiceUnavailableException('Database unreachable');
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
