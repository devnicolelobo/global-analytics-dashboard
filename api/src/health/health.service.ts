import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface HealthOkResponse {
  status: 'ok';
  timestamp: string;
}

const DB_PING_TIMEOUT_MS = 3_000;

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

  private async assertDatabaseReachable(): Promise<void> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise<never>((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error(`Database ping timed out after ${DB_PING_TIMEOUT_MS}ms`));
          }, DB_PING_TIMEOUT_MS);
        }),
      ]);
    } catch (error: unknown) {
      this.logger.warn(
        'Database readiness check failed',
        error instanceof Error ? error.message : undefined,
      );
      throw new ServiceUnavailableException('Database unreachable');
    } finally {
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    }
  }
}
