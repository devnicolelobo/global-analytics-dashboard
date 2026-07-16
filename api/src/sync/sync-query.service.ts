import { Injectable } from '@nestjs/common';
import { SyncStatusDto } from './dto/sync-status.dto';
import { SyncRunDto } from './dto/sync-run.dto';

/**
 * Read-side sync queries (status + run detail).
 * Separated from IngestService (write/orchestration) per card guidance.
 * Implementations land in later steps of this card.
 */
@Injectable()
export class SyncQueryService {
  getStatus(): Promise<SyncStatusDto> {
    throw new Error('SyncQueryService.getStatus not implemented yet');
  }

  getRunById(id: string): Promise<SyncRunDto> {
    void id;
    throw new Error('SyncQueryService.getRunById not implemented yet');
  }
}
