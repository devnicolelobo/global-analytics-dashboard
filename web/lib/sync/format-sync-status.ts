/**
 * SyncStatus DTO → footer display helpers (DEV-94 / REQ-F-52).
 *
 * GET /sync/status is the canonical freshness source (API_SPEC §5.1) — not
 * summary.meta alone, which only reflects embedded metadata on one response.
 */
import { sanitizeDisplayText } from '@/lib/kpis/sanitize-display';

const ISO_INSTANT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

const ISO_DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseIsoInstant(value: string): Date | null {
  if (!ISO_INSTANT.test(value)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoDateOnly(value: string): Date | null {
  if (!ISO_DATE_ONLY.test(value)) {
    return null;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Untrusted dataSource label — plain text only. */
export function formatDataSourceLabel(dataSource: string): string {
  const sanitized = sanitizeDisplayText(dataSource, 64);
  return sanitized.length > 0 ? sanitized : 'Unknown source';
}

/** Human-readable last sync time or honest empty copy when null. */
export function formatLastSuccessfulSyncAt(
  lastSuccessfulSyncAt: string | null,
): string {
  if (lastSuccessfulSyncAt === null) {
    return 'Never synced';
  }

  const parsed = parseIsoInstant(lastSuccessfulSyncAt.trim());
  if (parsed === null) {
    return 'Unavailable';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed);
}

/** Optional latestReferenceDate suffix for footer (API_SPEC §5.1). */
export function formatLatestReferenceDate(
  latestReferenceDate: string | null,
): string | null {
  if (latestReferenceDate === null) {
    return null;
  }

  const trimmed = latestReferenceDate.trim();
  const parsed = parseIsoDateOnly(trimmed);
  if (parsed === null) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
    parsed,
  );
}

const SYNC_STATUS_LABELS: Readonly<Record<string, string>> = {
  success: 'Success',
  failed: 'Failed',
  running: 'Running',
};

/** Display last sync run status when present (running | success | failed). */
export function formatLastSyncStatus(
  lastSyncStatus: string | null,
): string | null {
  if (lastSyncStatus === null) {
    return null;
  }

  const sanitized = sanitizeDisplayText(lastSyncStatus, 32);
  if (sanitized.length === 0) {
    return null;
  }

  const normalized = sanitized.toLowerCase();
  return SYNC_STATUS_LABELS[normalized] ?? sanitized;
}
