import { Controller, Get } from '@nestjs/common';
import { HealthOkResponse, HealthService } from './health.service';

/**
 * Operational probe — no auth (DEPLOYMENT.md §12).
 * GET /health → 200 { status, timestamp } or 503 via filter if DB fails.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthOkResponse> {
    return this.healthService.check();
  }
}
