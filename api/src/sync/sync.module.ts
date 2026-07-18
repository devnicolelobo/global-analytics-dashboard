import { Module } from '@nestjs/common';
import { IngestModule } from '../ingest/ingest.module';
import { SyncController } from './sync.controller';
import { SyncQueryService } from './sync-query.service';

/**
 * HTTP sync feature module — wires IngestService (write) + SyncQueryService (read).
 * Prisma is global; upstream client comes via IngestModule → ApiNinjasModule.
 */
@Module({
  imports: [IngestModule],
  controllers: [SyncController],
  providers: [SyncQueryService],
})
export class SyncModule {}
