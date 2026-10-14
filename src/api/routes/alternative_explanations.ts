import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { AlternativeExplanation } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createAltExpSchema = z.object({
  claim_id: z.string().min(1),
  explanation_text: z.string().min(1),
  plausibility: z.enum(['high', 'medium', 'low', 'speculative']),
  supporting_evidence_ids: z.array(z.string()).default([]),
  status: z.enum(['active', 'dismissed', 'needs_investigation'])
});

const updateAltExpSchema = createAltExpSchema.partial();

export async function alternativeExplanationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/alternative-explanations', async () => {
    const rows = repo.alternative_explanations.getAll.all();
    return rows.map(r => repo.alternative_explanations.parse(r));
  });

  app.get('/alternative-explanations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.alternative_explanations.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Alternative explanation not found' });
    return repo.alternative_explanations.parse(row);
  });

  app.get('/claims/:claimId/alternative-explanations', async (request, reply) => {
    const { claimId } = request.params as { claimId: string };
    const rows = repo.alternative_explanations.getByClaim.all(claimId);
    return rows.map(r => repo.alternative_explanations.parse(r));
  });

  app.post('/alternative-explanations', async (request, reply) => {
    const parsed = createAltExpSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    if (!repo.claims.get.get(data.claim_id)) return reply.code(404).send({ error: 'Claim not found' });
    for (const eid of data.supporting_evidence_ids) {
      if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
    }

    const altExp: AlternativeExplanation = {
      schema_version: '1.0.0',
      id: `alt_exp_${uuidv4().slice(0, 8)}`,
      type: 'alternative_explanation',
      revision: 1,
      title: data.explanation_text.slice(0, 80),
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      ...data
    };

    repo.alternative_explanations.create.run(
      altExp.id, altExp.schema_version, altExp.type, altExp.revision, altExp.title,
      altExp.created_at, altExp.updated_at, altExp.created_by, altExp.fixture ? 1 : 0,
      altExp.lifecycle, altExp.review ? JSON.stringify(altExp.review) : null,
      altExp.review_due_at, altExp.change_reason,
      altExp.claim_id, altExp.explanation_text, altExp.plausibility,
      JSON.stringify(altExp.supporting_evidence_ids), altExp.status
    );

    return reply.code(201).send(altExp);
  });

  app.patch('/alternative-explanations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.alternative_explanations.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Alternative explanation not found' });

    const existing = repo.alternative_explanations.parse(existingRow);
    const parsed = updateAltExpSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.supporting_evidence_ids) {
      for (const eid of parsed.data.supporting_evidence_ids) {
        if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
      }
    }

    const updated: AlternativeExplanation = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'alternative_explanation',
      revision: existing.revision + 1,
      title: parsed.data.explanation_text ? parsed.data.explanation_text.slice(0, 80) : existing.title,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      claim_id: parsed.data.claim_id ?? existing.claim_id,
      explanation_text: parsed.data.explanation_text ?? existing.explanation_text,
      plausibility: parsed.data.plausibility ?? existing.plausibility,
      supporting_evidence_ids: parsed.data.supporting_evidence_ids ?? existing.supporting_evidence_ids,
      status: parsed.data.status ?? existing.status
    };

    repo.alternative_explanations.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.claim_id, updated.explanation_text, updated.plausibility,
      JSON.stringify(updated.supporting_evidence_ids), updated.status,
      updated.id
    );

    return updated;
  });

  app.delete('/alternative-explanations/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.alternative_explanations.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Alternative explanation not found' });
    repo.alternative_explanations.delete.run(id);
    return { success: true };
  });
}