import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { IngestService } from '../ingest/ingest.service';
import { SyncAcceptedDto } from './dto/sync-accepted.dto';
import { SyncRunDto } from './dto/sync-run.dto';
import { SyncStatusDto } from './dto/sync-status.dto';
import { SyncTriggerDto } from './dto/sync-trigger.dto';
import { SyncQueryService } from './sync-query.service';

/**
 * Operator sync HTTP surface (API_SPEC §7).
 * POST /sync → 202 (background ingest).
 * GET /sync/status → freshness. GET /sync/runs/:id → run detail.
 */
@Controller('sync')
export class SyncController {
  constructor(
    private readonly ingestService: IngestService,
    private readonly syncQueryService: SyncQueryService,
  ) {}

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

  /** Freshness metadata for UI footer / operators (API_SPEC §7.2 / §5.1). */
  @Get('status')
  getStatus(): Promise<SyncStatusDto> {
    return this.syncQueryService.getStatus();
  }

  /** Single SyncRun detail for debugging (API_SPEC §7.3). */
  @Get('runs/:id')
  getRun(@Param('id') id: string): Promise<SyncRunDto> {
    return this.syncQueryService.getRunById(id);
  }
}
