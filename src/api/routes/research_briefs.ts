import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { ResearchBrief } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createBriefSchema = z.object({
  topic_id: z.string().min(1),
  findings: z.array(z.object({
    claim_id: z.string(),
    summary: z.string(),
    evidence_level: z.enum(['A', 'B', 'C', 'D'])
  })),
  uncertainties: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  claim_to_evidence_map: z.record(z.array(z.string())).default({})
});

const updateBriefSchema = createBriefSchema.partial();

export async function researchBriefRoutes(app: FastifyInstance): Promise<void> {
  app.get('/research-briefs', async () => {
    const rows = repo.research_briefs.getAll.all();
    return rows.map(r => repo.research_briefs.parse(r));
  });

  app.get('/research-briefs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.research_briefs.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Research brief not found' });
    return repo.research_briefs.parse(row);
  });

  app.get('/topics/:topicId/research-briefs', async (request, reply) => {
    const { topicId } = request.params as { topicId: string };
    const rows = repo.research_briefs.getByTopic.all(topicId);
    return rows.map(r => repo.research_briefs.parse(r));
  });

  app.post('/research-briefs', async (request, reply) => {
    const parsed = createBriefSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    if (!repo.topics.get.get(data.topic_id)) return reply.code(404).send({ error: 'Topic not found' });
    for (const f of data.findings) {
      if (!repo.claims.get.get(f.claim_id)) return reply.code(404).send({ error: `Claim ${f.claim_id} not found` });
    }

    const brief: ResearchBrief = {
      schema_version: '1.0.0',
      id: `brief_${uuidv4().slice(0, 8)}`,
      type: 'research_brief',
      revision: 1,
      title: 'Research Brief',
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

    repo.research_briefs.create.run(
      brief.id, brief.schema_version, brief.type, brief.revision, brief.title,
      brief.created_at, brief.updated_at, brief.created_by, brief.fixture ? 1 : 0,
      brief.lifecycle, brief.review ? JSON.stringify(brief.review) : null,
      brief.review_due_at, brief.change_reason,
      brief.topic_id,
      JSON.stringify(brief.findings),
      JSON.stringify(brief.uncertainties),
      JSON.stringify(brief.gaps),
      JSON.stringify(brief.claim_to_evidence_map)
    );

    return reply.code(201).send(brief);
  });

  app.patch('/research-briefs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.research_briefs.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Research brief not found' });

    const existing = repo.research_briefs.parse(existingRow);
    const parsed = updateBriefSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.topic_id && !repo.topics.get.get(parsed.data.topic_id)) {
      return reply.code(404).send({ error: 'Topic not found' });
    }
    if (parsed.data.findings) {
      for (const f of parsed.data.findings) {
        if (!repo.claims.get.get(f.claim_id)) return reply.code(404).send({ error: `Claim ${f.claim_id} not found` });
      }
    }

    const updated: ResearchBrief = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'research_brief',
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
      topic_id: parsed.data.topic_id ?? existing.topic_id,
      findings: parsed.data.findings ?? existing.findings,
      uncertainties: parsed.data.uncertainties ?? existing.uncertainties,
      gaps: parsed.data.gaps ?? existing.gaps,
      claim_to_evidence_map: parsed.data.claim_to_evidence_map ?? existing.claim_to_evidence_map
    };

    repo.research_briefs.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.topic_id,
      JSON.stringify(updated.findings),
      JSON.stringify(updated.uncertainties),
      JSON.stringify(updated.gaps),
      JSON.stringify(updated.claim_to_evidence_map),
      updated.id
    );

    return updated;
  });

  app.delete('/research-briefs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.research_briefs.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Research brief not found' });
    repo.research_briefs.delete.run(id);
    return { success: true };
  });
}