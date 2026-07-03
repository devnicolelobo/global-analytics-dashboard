# Architecture Decision Records (ADRs)

Formal record of significant technical decisions for **Global Analytics Dashboard**.

ADRs capture **context**, **decision**, and **consequences** so future changes are traceable. Superseded decisions are replaced by a new ADR — existing records are not silently rewritten.

Process reference: [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) (Section 4 — canonical approaches).

---

## Index

| ADR | Title | Status |
|-----|-------|--------|
| [ADR-001](./ADR-001-technology-stack.md) | Technology stack | Accepted |
| [ADR-002](./ADR-002-project-architecture.md) | Project architecture (monorepo) | Accepted |
| [ADR-003](./ADR-003-database-choice.md) | Database and ORM | Accepted |
| [ADR-004](./ADR-004-api-provider.md) | Upstream COVID-19 data provider | Accepted |
| [ADR-005](./ADR-005-map-library.md) | Geospatial map library | Accepted |

---

## When to write an ADR

Create or update an ADR when a decision:

- Affects architecture, stack, or integration boundaries
- Is difficult or costly to reverse
- Needs to be understood months later without re-discussion

Routine implementation details that follow an existing ADR do not require a new record.

---

## Template

```markdown
# ADR-NNN — Title

| | |
|---|---|
| **Status** | Proposed / Accepted / Deprecated / Superseded by ADR-XXX |
| **Date** | YYYY-MM-DD |
| **Deciders** | … |

## Context

What problem or constraint led to this decision?

## Decision

What was chosen and how it will be applied.

## Alternatives considered

| Option | Outcome |
|--------|---------|
| … | Rejected — reason |

## Consequences

### Positive
- …

### Negative / trade-offs
- …

## References

- Related ADRs, docs, or specs (internal links only)
```

---

## Related documents

| Document | Purpose |
|----------|---------|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Consolidated system architecture (planned) |
| [PROJECT_MANAGEMENT.md](../PROJECT_MANAGEMENT.md) | Governance and phases |
| [docs/README.md](../README.md) | Documentation index |
