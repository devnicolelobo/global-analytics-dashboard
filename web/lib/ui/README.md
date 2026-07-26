# Shared UI helpers (DEV-94)

Cross-panel fetch UX for Sprint 03 dashboard.

## Components (`web/components/ui/`)

| Component | Role |
|-----------|------|
| `LoadingState` | Inline or panel loading copy with `role="status"` |
| `ErrorState` | Recoverable error alert + optional **Try again** button |

## Lib (`web/lib/ui/`)

| File | Role |
|------|------|
| `fetch-error-message.ts` | Map `ApiError` / unknown errors to sanitized English plain text |

KPI, map, and chart panels import these instead of duplicating alert markup.
