# Sprint records

Execution history for **Global Analytics Dashboard**. Each file summarizes one sprint: goal, scope, outcomes, and any schedule or risk adjustments.

Methodology, release policy, and Definition of Done are defined in [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) (Sections 11, 12, and 18). Day-to-day work is tracked in **Linear** (`DEV-XX`); sprint records are the durable project log in the repository.

---

## Purpose

| Source | Role |
|--------|------|
| **Linear** | Backlog, status, dependencies, card-level detail |
| **docs/sprints/** | Sprint-level summary after close — goal, deliverables, decisions, retrospective notes |
| **PROJECT_MANAGEMENT.md** | Stable process — phases, milestones, release cadence |

Sprint records are published at **sprint close**, before or as part of the release ritual (`develop` → `main`).

---

## Naming convention

```
sprint-<number>-<theme>.md
```

| Part | Rule | Example |
|------|------|---------|
| `number` | Two-digit sequence, zero-padded | `01`, `02` |
| `theme` | Short kebab-case slug for the sprint focus | `foundation`, `backend-ingest` |

---

## Sprint index

| Sprint | Period (target) | Goal | Record | Status |
|--------|-----------------|------|--------|--------|
| 01 | Jul 2026 | Repository foundation, governance, and specifications (M1 + M2) | [sprint-01-foundation.md](./sprint-01-foundation.md) | Complete |
| 02 | Jul 2026 | Backend data layer — Prisma, ingest, internal API (M3) | [sprint-02-backend-data-layer.md](./sprint-02-backend-data-layer.md) | Complete |

*Dates are targets; revised at sprint close per [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md#18-sprint-management).*

---

## Record template

Use this structure when creating a new sprint file:

```markdown
# Sprint NN — <Theme>

| | |
|---|---|
| **Period** | YYYY-MM-DD → YYYY-MM-DD |
| **Sprint goal** | One sentence |
| **Milestone** | M1 / M2 / … (if applicable) |
| **Phase** | 0–5 (see PROJECT_MANAGEMENT.md) |

## Scope (Linear)

| Card | Title | Status |
|------|-------|--------|
| DEV-XX | … | Done / Carried over |

## Deliverables

- [ ] …

## Outcomes

What shipped, what was deferred, and why.

## Release

| Item | Value |
|------|-------|
| Release tag | vX.Y.Z or N/A |
| PR | develop → main (link) |

## Retrospective

- **Went well:** …
- **Improve:** …
- **Schedule / risk changes:** …
```

---

## Related documents

| Document | Purpose |
|----------|---------|
| [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) | Governance, milestones, sprint cycle |
| [CONTRIBUTING.md](../../CONTRIBUTING.md) | Branches, commits, pull requests |
| [docs/README.md](../README.md) | Documentation index |
