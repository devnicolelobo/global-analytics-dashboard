import { Module } from '@nestjs/common';
import { CovidController } from './covid.controller';
import { CovidQueryService } from './covid-query.service';
import { CovidService } from './covid.service';

/**
 * COVID read feature module (API_SPEC §6).
 * Prisma is global — no local import needed.
 */
@Module({
  controllers: [CovidController],
  providers: [CovidQueryService, CovidService],
})
export class CovidModule {}
