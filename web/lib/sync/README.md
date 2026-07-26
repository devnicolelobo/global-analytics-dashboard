# Sync freshness helpers (DEV-94)

Footer metadata from **`GET /sync/status`** (API_SPEC §5.1) — preferred over embedded `summary.meta` alone.

## Files

| File | Role |
|------|------|
| `format-sync-status.ts` | Plain-text formatters for `SyncStatus` DTO fields |
| `use-sync-status-data.ts` | Footer fetch hook — abort on unmount, manual retry |

## Security

All API strings pass through `sanitizeDisplayText` before React text rendering. Footer never triggers `POST /sync`.
