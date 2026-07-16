import { IsIn, IsOptional } from 'class-validator';
import { SYNC_MODES, type SyncMode } from '../../ingest/ingest.service';

/**
 * Optional body for POST /sync (API_SPEC §7.1).
 * Missing body or missing mode → default `full` in the controller.
 */
export class SyncTriggerDto {
  @IsOptional()
  @IsIn([...SYNC_MODES], {
    message: `mode must be one of: ${SYNC_MODES.join(', ')}`,
  })
  mode?: SyncMode;
}
