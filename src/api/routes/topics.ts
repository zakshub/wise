import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Topic } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createTopicSchema = z.object({
  claim_ids: z.array(z.string()).default([]),
  source_ids: z.array(z.string()).default([]),
  priority_rationale: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'on_hold']).default('active')
});

const updateTopicSchema = createTopicSchema.partial();

export async function topicRoutes(app: FastifyInstance): Promise<void> {
  app.get('/topics', async () => {
    const rows = repo.topics.getAll.all();
    return rows.map(r => repo.topics.parse(r));
  });

  app.get('/topics/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.topics.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Topic not found' });
    return repo.topics.parse(row);
  });

  app.post('/topics', async (request, reply) => {
    const parsed = createTopicSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    for (const cid of data.claim_ids) if (!repo.claims.get.get(cid)) return reply.code(404).send({ error: `Claim ${cid} not found` });
    for (const sid of data.source_ids) if (!repo.sources.get.get(sid)) return reply.code(404).send({ error: `Source ${sid} not found` });

    const topic: Topic = {
      schema_version: '1.0.0',
      id: `topic_${uuidv4().slice(0, 8)}`,
      type: 'topic',
      revision: 1,
      title: 'Research Topic',
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      claim_ids: data.claim_ids,
      source_ids: data.source_ids,
      priority_rationale: data.priority_rationale ?? null,
      status: data.status
    };

    repo.topics.create.run(
      topic.id, topic.schema_version, topic.type, topic.revision, topic.title,
      topic.created_at, topic.updated_at, topic.created_by, topic.fixture ? 1 : 0,
      topic.lifecycle, topic.review ? JSON.stringify(topic.review) : null,
      topic.review_due_at, topic.change_reason,
      JSON.stringify(topic.claim_ids), JSON.stringify(topic.source_ids),
      topic.priority_rationale, topic.status
    );

    return reply.code(201).send(topic);
  });

  app.patch('/topics/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.topics.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Topic not found' });

    const existing = repo.topics.parse(existingRow);
    const parsed = updateTopicSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.claim_ids) {
      for (const cid of parsed.data.claim_ids) if (!repo.claims.get.get(cid)) return reply.code(404).send({ error: `Claim ${cid} not found` });
    }
    if (parsed.data.source_ids) {
      for (const sid of parsed.data.source_ids) if (!repo.sources.get.get(sid)) return reply.code(404).send({ error: `Source ${sid} not found` });
    }

    const updated: Topic = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'topic',
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
      claim_ids: parsed.data.claim_ids ?? existing.claim_ids,
      source_ids: parsed.data.source_ids ?? existing.source_ids,
      priority_rationale: parsed.data.priority_rationale ?? existing.priority_rationale,
      status: parsed.data.status ?? existing.status
    };

    repo.topics.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      JSON.stringify(updated.claim_ids), JSON.stringify(updated.source_ids),
      updated.priority_rationale, updated.status,
      updated.id
    );

    return updated;
  });

  app.delete('/topics/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.topics.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Topic not found' });
    repo.topics.delete.run(id);
    return { success: true };
  });
}