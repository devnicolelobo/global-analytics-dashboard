import { Controller } from '@nestjs/common';

/**
 * Operator sync HTTP surface (API_SPEC §7).
 * Routes are added in subsequent steps: POST /sync, GET /sync/status, GET /sync/runs/:id.
 * Dependencies (IngestService, SyncQueryService) are injected when routes land.
 */
@Controller('sync')
export class SyncController {}
