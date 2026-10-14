import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { LinkedInDraft, ResearchBrief, Source } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createDraftSchema = z.object({
  brief_id: z.string().min(1),
  content_text: z.string().min(1),
  claim_to_source_map: z.array(z.object({
    claim_text: z.string(),
    source_ids: z.array(z.string()),
    evidence_level: z.enum(['A', 'B', 'C', 'D']),
    is_supported: z.boolean()
  })).min(1)
});

const updateDraftSchema = createDraftSchema.partial().extend({
  owner_decision: z.enum(['pending', 'approved', 'rejected', 'needs_revision']).optional(),
  owner_notes: z.string().nullable().optional()
});

function validateDraft(brief: ResearchBrief, claimToSourceMap: LinkedInDraft['claim_to_source_map']): LinkedInDraft['risk_flags'] {
  const flags: LinkedInDraft['risk_flags'] = [];
  const claimMap = new Map(brief.findings.map(f => [f.claim_id, f]));
  const evidenceLevelMap: Record<string, 'A'|'B'|'C'|'D'> = {};
  for (const f of brief.findings) {
    evidenceLevelMap[f.claim_id] = f.evidence_level;
  }

  for (const mapping of claimToSourceMap) {
    const claimId = brief.findings.find(f => f.summary === mapping.claim_text || f.claim_id === mapping.claim_text)?.claim_id;
    if (!claimId) {
      flags.push({
        type: 'unsupported_claim',
        description: `Claim "${mapping.claim_text}" not found in brief findings`,
        severity: 'high'
      });
      continue;
    }

    const finding = claimMap.get(claimId);
    if (finding && finding.evidence_level === 'D' && mapping.evidence_level !== 'D') {
      flags.push({
        type: 'unsupported_claim',
        description: `Claim mapped as ${mapping.evidence_level} but brief shows Level D (hypothesis)`,
        severity: 'high'
      });
    }

    if (!mapping.is_supported) {
      flags.push({
        type: 'unsupported_claim',
        description: `Claim "${mapping.claim_text}" marked as unsupported`,
        severity: 'high'
      });
    }

    if (mapping.source_ids.length === 1) {
      const source = repo.sources.get.get(mapping.source_ids[0]);
      if (source) {
        const parsedSource = repo.sources.parse(source);
        if (parsedSource.employer_context) {
          flags.push({
            type: 'named_employer_threshold',
            description: `Single source for named employer: ${parsedSource.employer_context}`,
            severity: 'medium'
          });
        }
      }
      flags.push({
        type: 'single_source',
        description: `Claim relies on single source`,
        severity: 'medium'
      });
    }

    for (const sid of mapping.source_ids) {
      const sourceRow = repo.sources.get.get(sid);
      if (sourceRow) {
        const source = repo.sources.parse(sourceRow);
        if (source.availability_status !== 'accessible') {
          flags.push({
            type: 'missing_context',
            description: `Source ${sid} has access limitation: ${source.availability_status}`,
            severity: 'medium'
          });
        }
        if (source.limitations) {
          flags.push({
            type: 'missing_context',
            description: `Source limitation: ${source.limitations}`,
            severity: 'low'
          });
        }
      }
    }
  }

  return flags;
}

export async function linkedinDraftRoutes(app: FastifyInstance): Promise<void> {
  app.get('/linkedin-drafts', async () => {
    const rows = repo.linkedin_drafts.getAll.all();
    return rows.map(r => repo.linkedin_drafts.parse(r));
  });

  app.get('/linkedin-drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.linkedin_drafts.get.get(id);
    if (!row) return reply.code(404).send({ error: 'LinkedIn draft not found' });
    return repo.linkedin_drafts.parse(row);
  });

  app.get('/research-briefs/:briefId/linkedin-drafts', async (request, reply) => {
    const { briefId } = request.params as { briefId: string };
    const rows = repo.linkedin_drafts.getByBrief.all(briefId);
    return rows.map(r => repo.linkedin_drafts.parse(r));
  });

  app.post('/linkedin-drafts', async (request, reply) => {
    const parsed = createDraftSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    const briefRow = repo.research_briefs.get.get(data.brief_id);
    if (!briefRow) return reply.code(404).send({ error: 'Research brief not found' });
    const brief = repo.research_briefs.parse(briefRow);

    const risk_flags = validateDraft(brief, data.claim_to_source_map);
    const validation_status = risk_flags.some(f => f.severity === 'blocking' || f.severity === 'high') ? 'failed' : 'passed';

    const draft: LinkedInDraft = {
      schema_version: '1.0.0',
      id: `draft_${uuidv4().slice(0, 8)}`,
      type: 'linkedin_draft',
      revision: 1,
      title: 'LinkedIn Draft',
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      brief_id: data.brief_id,
      content_text: data.content_text,
      claim_to_source_map: data.claim_to_source_map,
      risk_flags,
      validation_status,
      owner_decision: 'pending',
      owner_notes: null
    };

    repo.linkedin_drafts.create.run(
      draft.id, draft.schema_version, draft.type, draft.revision, draft.title,
      draft.created_at, draft.updated_at, draft.created_by, draft.fixture ? 1 : 0,
      draft.lifecycle, draft.review ? JSON.stringify(draft.review) : null,
      draft.review_due_at, draft.change_reason,
      draft.brief_id, draft.content_text,
      JSON.stringify(draft.claim_to_source_map),
      JSON.stringify(draft.risk_flags),
      draft.validation_status, draft.owner_decision, draft.owner_notes
    );

    return reply.code(201).send(draft);
  });

  app.patch('/linkedin-drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.linkedin_drafts.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'LinkedIn draft not found' });

    const existing = repo.linkedin_drafts.parse(existingRow);
    const parsed = updateDraftSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    let risk_flags = existing.risk_flags;
    let validation_status = existing.validation_status;
    const claimToSourceMap = parsed.data.claim_to_source_map ?? existing.claim_to_source_map;

    if (parsed.data.claim_to_source_map) {
      const briefRow = repo.research_briefs.get.get(existing.brief_id);
      if (briefRow) {
        const brief = repo.research_briefs.parse(briefRow);
        risk_flags = validateDraft(brief, claimToSourceMap);
        validation_status = risk_flags.some(f => f.severity === 'blocking' || f.severity === 'high') ? 'failed' : 'passed';
      }
    }

    const updated: LinkedInDraft = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'linkedin_draft',
      revision: existing.revision + 1,
      title: existing.title,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      brief_id: existing.brief_id,
      content_text: parsed.data.content_text ?? existing.content_text,
      claim_to_source_map: claimToSourceMap,
      risk_flags,
      validation_status,
      owner_decision: parsed.data.owner_decision ?? existing.owner_decision,
      owner_notes: parsed.data.owner_notes ?? existing.owner_notes
    };

    repo.linkedin_drafts.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.brief_id, updated.content_text,
      JSON.stringify(updated.claim_to_source_map),
      JSON.stringify(updated.risk_flags),
      updated.validation_status, updated.owner_decision, updated.owner_notes,
      updated.id
    );

    return updated;
  });

  app.delete('/linkedin-drafts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.linkedin_drafts.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'LinkedIn draft not found' });
    repo.linkedin_drafts.delete.run(id);
    return { success: true };
  });
}