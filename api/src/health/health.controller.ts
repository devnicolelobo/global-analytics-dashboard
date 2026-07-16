import { Controller, Get } from '@nestjs/common';
import { HealthOkResponse, HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthOkResponse> {
    return this.healthService.check();
  }
}
