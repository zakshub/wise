import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Conflict } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createConflictSchema = z.object({
  competing_claim_ids: z.array(z.string()).min(2),
  evidence_for_each: z.record(z.array(z.string())),
  state: z.enum(['open', 'resolved', 'deferred']).default('open'),
  resolution: z.string().nullable().optional(),
  resolved_by: z.string().nullable().optional(),
  resolved_at: z.string().datetime().nullable().optional()
});

const updateConflictSchema = createConflictSchema.partial();

export async function conflictRoutes(app: FastifyInstance): Promise<void> {
  app.get('/conflicts', async () => {
    const rows = repo.conflicts.getAll.all();
    return rows.map(r => repo.conflicts.parse(r));
  });

  app.get('/conflicts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.conflicts.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Conflict not found' });
    return repo.conflicts.parse(row);
  });

  app.post('/conflicts', async (request, reply) => {
    const parsed = createConflictSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    for (const cid of data.competing_claim_ids) {
      if (!repo.claims.get.get(cid)) return reply.code(404).send({ error: `Claim ${cid} not found` });
    }
    for (const [cid, eids] of Object.entries(data.evidence_for_each)) {
      for (const eid of eids) {
        if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
      }
    }

    const conflict: Conflict = {
      schema_version: '1.0.0',
      id: `conflict_${uuidv4().slice(0, 8)}`,
      type: 'conflict',
      revision: 1,
      title: 'Claim Conflict',
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      ...data,
      competing_claim_ids: data.competing_claim_ids,
      evidence_for_each: data.evidence_for_each,
      resolution: data.resolution ?? null,
      resolved_by: data.resolved_by ?? null,
      resolved_at: data.resolved_at ?? null
    };

    repo.conflicts.create.run(
      conflict.id, conflict.schema_version, conflict.type, conflict.revision, conflict.title,
      conflict.created_at, conflict.updated_at, conflict.created_by, conflict.fixture ? 1 : 0,
      conflict.lifecycle, conflict.review ? JSON.stringify(conflict.review) : null,
      conflict.review_due_at, conflict.change_reason,
      JSON.stringify(conflict.competing_claim_ids),
      JSON.stringify(conflict.evidence_for_each),
      conflict.state, conflict.resolution, conflict.resolved_by, conflict.resolved_at
    );

    return reply.code(201).send(conflict);
  });

  app.patch('/conflicts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.conflicts.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Conflict not found' });

    const existing = repo.conflicts.parse(existingRow);
    const parsed = updateConflictSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    if (parsed.data.competing_claim_ids) {
      for (const cid of parsed.data.competing_claim_ids) {
        if (!repo.claims.get.get(cid)) return reply.code(404).send({ error: `Claim ${cid} not found` });
      }
    }
    if (parsed.data.evidence_for_each) {
      for (const [cid, eids] of Object.entries(parsed.data.evidence_for_each)) {
        for (const eid of eids) {
          if (!repo.evidence.get.get(eid)) return reply.code(404).send({ error: `Evidence ${eid} not found` });
        }
      }
    }

    const updated: Conflict = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'conflict',
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
      competing_claim_ids: parsed.data.competing_claim_ids ?? existing.competing_claim_ids,
      evidence_for_each: parsed.data.evidence_for_each ?? existing.evidence_for_each,
      state: parsed.data.state ?? existing.state,
      resolution: parsed.data.resolution ?? existing.resolution,
      resolved_by: parsed.data.resolved_by ?? existing.resolved_by,
      resolved_at: parsed.data.resolved_at ?? existing.resolved_at
    };

    repo.conflicts.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      JSON.stringify(updated.competing_claim_ids),
      JSON.stringify(updated.evidence_for_each),
      updated.state, updated.resolution, updated.resolved_by, updated.resolved_at,
      updated.id
    );

    return updated;
  });

  app.delete('/conflicts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.conflicts.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Conflict not found' });
    repo.conflicts.delete.run(id);
    return { success: true };
  });
}