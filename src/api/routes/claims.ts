import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Claim } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createClaimSchema = z.object({
  evidence_ids: z.array(z.string()).min(1),
  claim_text: z.string().min(1),
  claim_type: z.enum(['factual_statement', 'reported_allegation', 'corroborated_pattern', 'analytical_interpretation', 'hypothesis', 'model_suggestion', 'owner_approved_conclusion']),
  geographic_scope: z.string().nullable().optional(),
  industry_scope: z.string().nullable().optional(),
  employer_scope: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  uncertainty_notes: z.string().nullable().optional(),
  reviewer_decision: z.enum(['accepted', 'rejected', 'needs_more_evidence', 'flagged_for_review']).nullable().optional(),
  review_reason: z.string().nullable().optional()
});

const updateClaimSchema = createClaimSchema.partial();

export async function claimRoutes(app: FastifyInstance): Promise<void> {
  app.get('/claims', async () => {
    const rows = repo.claims.getAll.all();
    return rows.map(r => repo.claims.parse(r));
  });

  app.get('/claims/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.claims.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Claim not found' });
    return repo.claims.parse(row);
  });

  app.post('/claims', async (request, reply) => {
    const parsed = createClaimSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    for (const eid of data.evidence_ids) {
      if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
    }

    const claim: Claim = {
      schema_version: '1.0.0',
      id: `claim_${uuidv4().slice(0, 8)}`,
      type: 'claim',
      revision: 1,
      title: data.claim_text.slice(0, 80),
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      ...data,
      evidence_ids: data.evidence_ids,
      geographic_scope: data.geographic_scope ?? null,
      industry_scope: data.industry_scope ?? null,
      employer_scope: data.employer_scope ?? null,
      uncertainty_notes: data.uncertainty_notes ?? null,
      reviewer_decision: data.reviewer_decision ?? null,
      review_reason: data.review_reason ?? null
    };

    repo.claims.create.run(
      claim.id, claim.schema_version, claim.type, claim.revision, claim.title,
      claim.created_at, claim.updated_at, claim.created_by, claim.fixture ? 1 : 0,
      claim.lifecycle, claim.review ? JSON.stringify(claim.review) : null,
      claim.review_due_at, claim.change_reason,
      JSON.stringify(claim.evidence_ids), claim.claim_text, claim.claim_type,
      claim.geographic_scope, claim.industry_scope, claim.employer_scope,
      claim.confidence, claim.uncertainty_notes, claim.reviewer_decision, claim.review_reason
    );

    return reply.code(201).send(claim);
  });

  app.patch('/claims/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.claims.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Claim not found' });

    const existing = repo.claims.parse(existingRow);
    const parsed = updateClaimSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.evidence_ids) {
      for (const eid of parsed.data.evidence_ids) {
        if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
      }
    }

    const updated: Claim = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'claim',
      revision: existing.revision + 1,
      title: parsed.data.claim_text ? parsed.data.claim_text.slice(0, 80) : existing.title,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      evidence_ids: parsed.data.evidence_ids ?? existing.evidence_ids,
      claim_text: parsed.data.claim_text ?? existing.claim_text,
      claim_type: parsed.data.claim_type ?? existing.claim_type,
      geographic_scope: parsed.data.geographic_scope ?? existing.geographic_scope,
      industry_scope: parsed.data.industry_scope ?? existing.industry_scope,
      employer_scope: parsed.data.employer_scope ?? existing.employer_scope,
      confidence: parsed.data.confidence ?? existing.confidence,
      uncertainty_notes: parsed.data.uncertainty_notes ?? existing.uncertainty_notes,
      reviewer_decision: parsed.data.reviewer_decision ?? existing.reviewer_decision,
      review_reason: parsed.data.review_reason ?? existing.review_reason
    };

    repo.claims.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      JSON.stringify(updated.evidence_ids), updated.claim_text, updated.claim_type,
      updated.geographic_scope, updated.industry_scope, updated.employer_scope,
      updated.confidence, updated.uncertainty_notes, updated.reviewer_decision, updated.review_reason,
      updated.id
    );

    return updated;
  });

  app.delete('/claims/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.claims.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Claim not found' });
    repo.claims.delete.run(id);
    return { success: true };
  });
}