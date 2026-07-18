import { Module } from '@nestjs/common';
import { CovidController } from './covid.controller';
import { CovidQueryService } from './covid-query.service';
import { CovidService } from './covid.service';

/**
 * COVID read feature module (API_SPEC §6).
 * Prisma is global — no local import needed.
 * Controllers are read-only; write path lives in SyncModule / IngestModule.
 */
@Module({
  controllers: [CovidController],
  providers: [CovidQueryService, CovidService],
})
export class CovidModule {}
