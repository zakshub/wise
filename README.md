# Wise — Pakistan Workplace Research Intelligence

Private, owner-operated research intelligence system for investigating workplace realities in Pakistan and transforming credible evidence into analytical LinkedIn content.

## Core Loop

Discover → Normalize → Evaluate → Analyse → Prioritize → Draft → Review → Learn

Every stage preserves the connection between source material, extracted claims, evidence evaluation, analytical conclusions, and final content.

## Quick Start

```bash
# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Seed demo data
pnpm db:seed

# Start API server
pnpm dev

# Run tests
pnpm test

# CLI manual ingestion
pnpm cli --help
```

## CLI Commands

```bash
# Add a source
pnpm cli source:add --url "https://glassdoor.com/review/xyz" --type review_platform --geo "Karachi, Pakistan" --industry Technology --employer "Company Name"

# Add evidence from source
pnpm cli evidence:add --source source_abc123 --text "Observation text" --method direct_quote --scope individual_experience --level C --confidence 0.6

# Add claim from evidence
pnpm cli claim:add --evidence evidence_abc123 --text "Claim text" --type reported_allegation --confidence 0.55

# Add alternative explanation
pnpm cli alt:add --claim claim_abc123 --text "Alternative explanation" --plausibility medium --status active

# Create topic
pnpm cli topic:add --claims claim_abc123 --sources source_abc123 --rationale "High recurrence"

# Create research brief
pnpm cli brief:add --topic topic_abc123 --findings '[{"claim_id":"claim_abc123","summary":"...","evidence_level":"C"}]'
```

## API Endpoints

| Resource | Endpoints |
|----------|-----------|
| Sources | `GET/POST /api/sources`, `GET/PATCH/DELETE /api/sources/:id` |
| Evidence | `GET/POST /api/evidence`, `GET/PATCH/DELETE /api/evidence/:id`, `GET /api/sources/:sourceId/evidence` |
| Claims | `GET/POST /api/claims`, `GET/PATCH/DELETE /api/claims/:id` |
| Alternative Explanations | `GET/POST /api/alternative-explanations`, `GET/PATCH/DELETE /api/alternative-explanations/:id`, `GET /api/claims/:claimId/alternative-explanations` |
| Topics | `GET/POST /api/topics`, `GET/PATCH/DELETE /api/topics/:id` |
| Research Briefs | `GET/POST /api/research-briefs`, `GET/PATCH/DELETE /api/research-briefs/:id`, `GET /api/topics/:topicId/research-briefs` |
| LinkedIn Drafts | `GET/POST /api/linkedin-drafts`, `GET/PATCH/DELETE /api/linkedin-drafts/:id`, `GET /api/research-briefs/:briefId/linkedin-drafts` |
| Conflicts | `GET/POST /api/conflicts`, `GET/PATCH/DELETE /api/conflicts/:id` |
| References | `GET/POST /api/references`, `GET/PATCH/DELETE /api/references/:id`, `GET /api/sources/:sourceId/references` |

## Evidence Classification

- **Level A** — Strong, directly relevant evidence with credible support
- **Level B** — Corroborated by multiple independent sources
- **Level C** — Individual reported experience (not independently established)
- **Level D** — Hypothesis or interpretation requiring validation

## Draft Validation

LinkedIn drafts are automatically validated for:
- Unsupported claims (flagged)
- Named employer threshold (single source → medium severity)
- Missing context (source limitations, access issues)
- Evidence level mismatches

Owner must explicitly approve (`owner_decision: "approved"`) — no automatic publishing.

## Architecture

- **Language**: TypeScript / Node.js 22+
- **Database**: SQLite (local) → PostgreSQL (hosted)
- **API**: Fastify
- **Validation**: Zod
- **Testing**: Vitest

## Data Model

```
Source → Evidence → Claim → AlternativeExplanation
                    ↓
              Topic → ResearchBrief → LinkedInDraft
                    ↓
              Conflict (competing claims)
                    ↓
              Reference (source usage)
```

## Principles

- Evidence quality > automation volume
- No invented statistics, quotations, or experiences
- Named-employer criticism requires higher evidence threshold
- Human approval mandatory for all content
- Traceability from draft claims to source evidence
- Uncertainty made visible, not hidden behind confidence scores

## License

Private — owner-operated.