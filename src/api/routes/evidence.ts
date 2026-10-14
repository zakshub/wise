import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Evidence } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createEvidenceSchema = z.object({
  source_id: z.string().min(1),
  observation_text: z.string().min(1),
  interpretation: z.string().nullable().optional(),
  method: z.enum(['direct_quote', 'paraphrase', 'inference', 'statistical_extract', 'other']),
  scope: z.enum(['individual_experience', 'team_pattern', 'organization_wide', 'industry_wide', 'geographic_region']),
  evidence_level: z.enum(['A', 'B', 'C', 'D']),
  limitations: z.string().nullable().optional(),
  confidence: z.number().min(0).max(1),
  supporting_evidence_ids: z.array(z.string()).default([]),
  counterevidence_ids: z.array(z.string()).default([]),
  alternative_explanation_ids: z.array(z.string()).default([])
});

const updateEvidenceSchema = createEvidenceSchema.partial();

export async function evidenceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/evidence', async () => {
    const rows = repo.evidence.getAll.all();
    return rows.map(r => repo.evidence.parse(r));
  });

  app.get('/evidence/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.evidence.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Evidence not found' });
    return repo.evidence.parse(row);
  });

  app.get('/sources/:sourceId/evidence', async (request, reply) => {
    const { sourceId } = request.params as { sourceId: string };
    const rows = repo.evidence.getBySource.all(sourceId);
    return rows.map(r => repo.evidence.parse(r));
  });

  app.post('/evidence', async (request, reply) => {
    const parsed = createEvidenceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    const source = repo.sources.get.get(data.source_id);
    if (!source) return reply.code(404).send({ error: 'Source not found' });

    const evidence: Evidence = {
      schema_version: '1.0.0',
      id: `evidence_${uuidv4().slice(0, 8)}`,
      type: 'evidence',
      revision: 1,
      title: data.observation_text.slice(0, 80),
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      source_id: data.source_id,
      observation_text: data.observation_text,
      interpretation: data.interpretation ?? null,
      method: data.method,
      scope: data.scope,
      evidence_level: data.evidence_level,
      limitations: data.limitations ?? null,
      confidence: data.confidence,
      supporting_evidence_ids: data.supporting_evidence_ids,
      counterevidence_ids: data.counterevidence_ids,
      alternative_explanation_ids: data.alternative_explanation_ids
    };

    repo.evidence.create.run(
      evidence.id, evidence.schema_version, evidence.type, evidence.revision, evidence.title,
      evidence.created_at, evidence.updated_at, evidence.created_by, evidence.fixture ? 1 : 0,
      evidence.lifecycle, evidence.review ? JSON.stringify(evidence.review) : null,
      evidence.review_due_at, evidence.change_reason,
      evidence.source_id, evidence.observation_text, evidence.interpretation, evidence.method,
      evidence.scope, evidence.evidence_level, evidence.limitations, evidence.confidence,
      JSON.stringify(evidence.supporting_evidence_ids), JSON.stringify(evidence.counterevidence_ids),
      JSON.stringify(evidence.alternative_explanation_ids)
    );

    return reply.code(201).send(evidence);
  });

  app.patch('/evidence/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.evidence.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Evidence not found' });

    const existing = repo.evidence.parse(existingRow);
    const parsed = updateEvidenceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const updated: Evidence = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'evidence',
      revision: existing.revision + 1,
      title: parsed.data.observation_text ? parsed.data.observation_text.slice(0, 80) : existing.title,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      source_id: existing.source_id,
      observation_text: parsed.data.observation_text ?? existing.observation_text,
      interpretation: parsed.data.interpretation ?? existing.interpretation,
      method: parsed.data.method ?? existing.method,
      scope: parsed.data.scope ?? existing.scope,
      evidence_level: parsed.data.evidence_level ?? existing.evidence_level,
      limitations: parsed.data.limitations ?? existing.limitations,
      confidence: parsed.data.confidence ?? existing.confidence,
      supporting_evidence_ids: parsed.data.supporting_evidence_ids ?? existing.supporting_evidence_ids,
      counterevidence_ids: parsed.data.counterevidence_ids ?? existing.counterevidence_ids,
      alternative_explanation_ids: parsed.data.alternative_explanation_ids ?? existing.alternative_explanation_ids
    };

    repo.evidence.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.source_id, updated.observation_text, updated.interpretation, updated.method,
      updated.scope, updated.evidence_level, updated.limitations, updated.confidence,
      JSON.stringify(updated.supporting_evidence_ids), JSON.stringify(updated.counterevidence_ids),
      JSON.stringify(updated.alternative_explanation_ids),
      updated.id
    );

    return updated;
  });

  app.delete('/evidence/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.evidence.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Evidence not found' });
    repo.evidence.delete.run(id);
    return { success: true };
  });
}