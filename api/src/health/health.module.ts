import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Dedicated health module (replaces scaffold AppController GET /).
 * PrismaModule is global — HealthService injects PrismaService without re-import.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
