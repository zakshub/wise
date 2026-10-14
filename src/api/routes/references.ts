import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Reference } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createReferenceSchema = z.object({
  source_id: z.string().min(1),
  mechanism: z.enum(['citation', 'corroboration', 'counterevidence', 'context', 'methodology']),
  use_context: z.string().min(1),
  originality_note: z.string().nullable().optional()
});

const updateReferenceSchema = createReferenceSchema.partial();

export async function referenceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/references', async () => {
    const rows = repo.references.getAll.all();
    return rows.map(r => repo.references.parse(r));
  });

  app.get('/references/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.references.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Reference not found' });
    return repo.references.parse(row);
  });

  app.get('/sources/:sourceId/references', async (request, reply) => {
    const { sourceId } = request.params as { sourceId: string };
    const rows = repo.references.getBySource.all(sourceId);
    return rows.map(r => repo.references.parse(r));
  });

  app.post('/references', async (request, reply) => {
    const parsed = createReferenceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    if (!repo.sources.get.get(data.source_id)) return reply.code(404).send({ error: 'Source not found' });

    const reference: Reference = {
      schema_version: '1.0.0',
      id: `ref_${uuidv4().slice(0, 8)}`,
      type: 'reference',
      revision: 1,
      title: data.use_context.slice(0, 80),
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      ...data,
      originality_note: data.originality_note ?? null
    };

    repo.references.create.run(
      reference.id, reference.schema_version, reference.type, reference.revision, reference.title,
      reference.created_at, reference.updated_at, reference.created_by, reference.fixture ? 1 : 0,
      reference.lifecycle, reference.review ? JSON.stringify(reference.review) : null,
      reference.review_due_at, reference.change_reason,
      reference.source_id, reference.mechanism, reference.use_context, reference.originality_note
    );

    return reply.code(201).send(reference);
  });

  app.patch('/references/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.references.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Reference not found' });

    const existing = repo.references.parse(existingRow);
    const parsed = updateReferenceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.source_id && !repo.sources.get.get(parsed.data.source_id)) {
      return reply.code(404).send({ error: 'Source not found' });
    }

    const updated: Reference = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'reference',
      revision: existing.revision + 1,
      title: parsed.data.use_context ? parsed.data.use_context.slice(0, 80) : existing.title,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      source_id: parsed.data.source_id ?? existing.source_id,
      mechanism: parsed.data.mechanism ?? existing.mechanism,
      use_context: parsed.data.use_context ?? existing.use_context,
      originality_note: parsed.data.originality_note ?? existing.originality_note
    };

    repo.references.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.source_id, updated.mechanism, updated.use_context, updated.originality_note,
      updated.id
    );

    return updated;
  });

  app.delete('/references/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.references.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Reference not found' });
    repo.references.delete.run(id);
    return { success: true };
  });
}