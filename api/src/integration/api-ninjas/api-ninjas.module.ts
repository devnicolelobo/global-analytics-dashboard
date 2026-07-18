import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ApiNinjasClient } from './api-ninjas.client';
import { COVID_UPSTREAM_CLIENT } from './covid-upstream.client';

/**
 * Registers the API Ninjas HTTP client for server-side COVID-19 upstream calls.
 * @see docs/EXTERNAL_APIS.md §3
 */
@Module({
  // HttpService (axios) is required by ApiNinjasClient — not global by default.
  imports: [HttpModule],
  providers: [
    ApiNinjasClient,
    // Ingest injects COVID_UPSTREAM_CLIENT — swap provider here for Apify (ADR-004).
    {
      provide: COVID_UPSTREAM_CLIENT,
      useExisting: ApiNinjasClient,
    },
  ],
  exports: [ApiNinjasClient, COVID_UPSTREAM_CLIENT],
})
export class ApiNinjasModule {}
