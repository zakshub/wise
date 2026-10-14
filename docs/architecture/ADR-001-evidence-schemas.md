# ADR-001: Evidence Schema Design

## Status
Accepted

## Context
We need a data model for workplace research that preserves traceability from source material through evidence, claims, analysis, and final LinkedIn content. The model must support:
- Multiple source types with access limitations
- Evidence classification (A/B/C/D)
- Supporting and counterevidence
- Alternative explanations
- Claim-to-source mapping in drafts
- Revision history and review workflow

## Decision
Adapt the 9-schema contract system from `zakshub/designer` (Sentinel Designer Brain) for workplace research.

### Schemas Adapted
| Designer Schema | Wise Schema | Purpose |
|----------------|-------------|---------|
| source | source | Source metadata, access status, limitations |
| evidence | evidence | Observation, interpretation, evidence level, confidence |
| knowledge | claim | Contextual claim with evidence links, claim type |
| conflict | conflict | Competing claims with evidence |
| reference | reference | Source usage mechanism |
| expert-profile | — | Not used (no expert profiles in MVP) |
| skill | — | Not used |
| experiment | — | Not used |
| project-learning | — | Not used (supervised learning in Phase 4) |
| — | alternative_explanation | New: explicit alternative explanations per claim |
| — | topic | New: research topic workspace |
| — | research_brief | New: findings + uncertainties + gaps |
| — | linkedin_draft | New: content with claim-to-source map + validation |

### Key Adaptations
1. **Evidence levels** — Kept A/B/C/D from designer, mapped to research definitions
2. **Claim types** — Expanded to distinguish factual/allegation/pattern/interpretation/hypothesis/model/owner-approved
3. **Review workflow** — Common fields include `review` object with actor, decision, reason
4. **Revision history** — Every mutation increments `revision`, records `change_reason`
5. **Fixture mode** — `fixture` flag separates demo/test data from live data

## Consequences
- **Positive**: Proven schema patterns, strict validation, revision tracking, review workflow
- **Negative**: More schemas than minimal MVP; alternative_explanation/topic/brief/draft are new designs
- **Risk**: Schema evolution requires migration strategy (designer uses explicit versioning)

## Implementation
- `src/schemas/*.schema.json` — JSON Schema Draft 2020-12 contracts
- `src/schemas/types.ts` — TypeScript interfaces with type guards
- `src/db/migrate.ts` — SQLite tables with indexes
- `src/db/repository.ts` — CRUD with JSON serialization for arrays/objects
- `tests/core.test.ts` — Verifies full workflow and enum enforcement

## References
- Designer schemas: `zakshub/designer/schemas/README.md`
- Designer architecture: `zakshub/designer/brain/architecture.md`
- Requirements: §3 Evidence and Analytical Integrity, §7 MVP