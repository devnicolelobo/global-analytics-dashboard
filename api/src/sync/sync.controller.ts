import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { IngestService } from '../ingest/ingest.service';
import { SyncAcceptedDto } from './dto/sync-accepted.dto';
import { SyncTriggerDto } from './dto/sync-trigger.dto';

/**
 * Operator sync HTTP surface (API_SPEC §7).
 * POST /sync → 202 Accepted (ingest continues in background via IngestService.runSync).
 * GET routes land in later steps.
 */
@Controller('sync')
export class SyncController {
  constructor(private readonly ingestService: IngestService) {}

  /**
   * Trigger COVID ingest. Returns immediately with syncRunId (API_SPEC §7.1).
   * Concurrent running sync → SyncAlreadyRunningException → 409 envelope.
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async trigger(@Body() body: SyncTriggerDto): Promise<SyncAcceptedDto> {
    const mode = body.mode ?? 'full';
    const accepted = await this.ingestService.runSync(mode);
    return SyncAcceptedDto.from(accepted);
  }
}
