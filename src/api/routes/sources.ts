import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { repo } from '../../db/repository.js';
import type { Source } from '../../schemas/types.js';

function now(): string { return new Date().toISOString(); }

const createSourceSchema = z.object({
  url: z.string().url(),
  source_type: z.enum(['review_platform', 'news', 'government', 'academic', 'company_statement', 'forum', 'social_media', 'other']),
  publisher: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  geographic_context: z.string().nullable().optional(),
  industry_context: z.string().nullable().optional(),
  employer_context: z.string().nullable().optional(),
  availability_status: z.enum(['accessible', 'paywall', 'login_required', 'rate_limited', 'blocked', 'removed', 'unknown']),
  extraction_method: z.enum(['manual', 'api', 'rss', 'html_scrape', 'other']),
  reliability_notes: z.string().nullable().optional(),
  limitations: z.string().nullable().optional(),
  independence_group: z.string().nullable().optional()
});

const updateSourceSchema = createSourceSchema.partial();

export async function sourceRoutes(app: FastifyInstance): Promise<void> {
  app.get('/sources', async () => {
    const rows = repo.sources.getAll.all();
    return rows.map(r => repo.sources.parse(r));
  });

  app.get('/sources/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const row = repo.sources.get.get(id);
    if (!row) return reply.code(404).send({ error: 'Source not found' });
    return repo.sources.parse(row);
  });

  app.post('/sources', async (request, reply) => {
    const parsed = createSourceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const data = parsed.data;
    const source: Source = {
      schema_version: '1.0.0',
      id: `source_${uuidv4().slice(0, 8)}`,
      type: 'source',
      revision: 1,
      title: data.url,
      created_at: now(),
      updated_at: now(),
      created_by: 'owner',
      fixture: false,
      lifecycle: 'draft',
      review: null,
      review_due_at: null,
      change_reason: 'Created via API',
      ...data,
      accessed_at: now(),
      publisher: data.publisher ?? null,
      author: data.author ?? null,
      published_at: data.published_at ?? null,
      geographic_context: data.geographic_context ?? null,
      industry_context: data.industry_context ?? null,
      employer_context: data.employer_context ?? null,
      reliability_notes: data.reliability_notes ?? null,
      limitations: data.limitations ?? null,
      independence_group: data.independence_group ?? null
    };

    repo.sources.create.run(
      source.id, source.schema_version, source.type, source.revision, source.title,
      source.created_at, source.updated_at, source.created_by, source.fixture ? 1 : 0,
      source.lifecycle, source.review ? JSON.stringify(source.review) : null,
      source.review_due_at, source.change_reason,
      source.url, source.source_type, source.publisher, source.author, source.published_at,
      source.accessed_at, source.geographic_context, source.industry_context, source.employer_context,
      source.availability_status, source.extraction_method, source.reliability_notes, source.limitations, source.independence_group
    );

    return reply.code(201).send(source);
  });

  app.patch('/sources/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existingRow = repo.sources.get.get(id);
    if (!existingRow) return reply.code(404).send({ error: 'Source not found' });

    const existing = repo.sources.parse(existingRow);
    const parsed = updateSourceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });

    const updated: Source = {
      schema_version: existing.schema_version,
      id: existing.id,
      type: 'source',
      revision: existing.revision + 1,
      title: parsed.data.url ?? existing.url,
      created_at: existing.created_at,
      updated_at: now(),
      created_by: existing.created_by,
      fixture: existing.fixture,
      lifecycle: existing.lifecycle,
      review: existing.review,
      review_due_at: existing.review_due_at,
      change_reason: 'Updated via API',
      url: parsed.data.url ?? existing.url,
      source_type: parsed.data.source_type ?? existing.source_type,
      publisher: parsed.data.publisher ?? existing.publisher,
      author: parsed.data.author ?? existing.author,
      published_at: parsed.data.published_at ?? existing.published_at,
      accessed_at: now(),
      geographic_context: parsed.data.geographic_context ?? existing.geographic_context,
      industry_context: parsed.data.industry_context ?? existing.industry_context,
      employer_context: parsed.data.employer_context ?? existing.employer_context,
      availability_status: parsed.data.availability_status ?? existing.availability_status,
      extraction_method: parsed.data.extraction_method ?? existing.extraction_method,
      reliability_notes: parsed.data.reliability_notes ?? existing.reliability_notes,
      limitations: parsed.data.limitations ?? existing.limitations,
      independence_group: parsed.data.independence_group ?? existing.independence_group
    };

    repo.sources.update.run(
      updated.schema_version, updated.type, updated.revision, updated.title,
      updated.created_at, updated.updated_at, updated.created_by, updated.fixture ? 1 : 0,
      updated.lifecycle, updated.review ? JSON.stringify(updated.review) : null,
      updated.review_due_at, updated.change_reason,
      updated.url, updated.source_type, updated.publisher, updated.author, updated.published_at,
      updated.accessed_at, updated.geographic_context, updated.industry_context, updated.employer_context,
      updated.availability_status, updated.extraction_method, updated.reliability_notes, updated.limitations, updated.independence_group,
      updated.id
    );

    return updated;
  });

  app.delete('/sources/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = repo.sources.get.get(id);
    if (!existing) return reply.code(404).send({ error: 'Source not found' });
    repo.sources.delete.run(id);
    return { success: true };
  });
}