import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import { sourceRoutes } from '../src/api/routes/sources.js';
import { evidenceRoutes } from '../src/api/routes/evidence.js';
import { claimRoutes } from '../src/api/routes/claims.js';
import { alternativeExplanationRoutes } from '../src/api/routes/alternative_explanations.js';
import { topicRoutes } from '../src/api/routes/topics.js';
import { researchBriefRoutes } from '../src/api/routes/research_briefs.js';
import { linkedinDraftRoutes } from '../src/api/routes/linkedin_drafts.js';
import { conflictRoutes } from '../src/api/routes/conflicts.js';
import { referenceRoutes } from '../src/api/routes/references.js';
import { runMigrations } from '../src/db/migrate.js';
import { repo } from '../src/db/repository.js';
import { v4 as uuidv4 } from 'uuid';

function now(): string { return new Date().toISOString(); }

let app: any;

beforeAll(async () => {
  runMigrations();
  app = Fastify({ logger: false });
  await app.register(sourceRoutes, { prefix: '/api' });
  await app.register(evidenceRoutes, { prefix: '/api' });
  await app.register(claimRoutes, { prefix: '/api' });
  await app.register(alternativeExplanationRoutes, { prefix: '/api' });
  await app.register(topicRoutes, { prefix: '/api' });
  await app.register(researchBriefRoutes, { prefix: '/api' });
  await app.register(linkedinDraftRoutes, { prefix: '/api' });
  await app.register(conflictRoutes, { prefix: '/api' });
  await app.register(referenceRoutes, { prefix: '/api' });
  await app.ready();
});

afterAll(async () => {
  await app.close();
  const { closeRepo } = await import('../src/db/repository.js');
  closeRepo();
});

describe('API endpoints', () => {
  let sourceId: string;
  let evidenceId: string;
  let claimId: string;
  let altExpId: string;
  let topicId: string;
  let briefId: string;
  let draftId: string;

  it('POST /api/sources - create source', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sources',
      payload: {
        url: 'https://glassdoor.com/review/karachi-tech',
        source_type: 'review_platform',
        publisher: 'Glassdoor',
        author: 'Anonymous',
        published_at: '2024-01-15T10:00:00Z',
        geographic_context: 'Karachi, Pakistan',
        industry_context: 'Technology',
        employer_context: 'Karachi Tech Company',
        availability_status: 'accessible',
        extraction_method: 'manual',
        reliability_notes: 'Anonymous but detailed',
        limitations: 'Cannot verify employment',
        independence_group: 'glassdoor_karachi_tech'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    sourceId = body.id;
    expect(body.url).toBe('https://glassdoor.com/review/karachi-tech');
    expect(body.availability_status).toBe('accessible');
  });

  it('GET /api/sources/:id - fetch source', async () => {
    const res = await app.inject({ method: 'GET', url: `/api/sources/${sourceId}` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(sourceId);
  });

  it('POST /api/evidence - create evidence', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/evidence',
      payload: {
        source_id: sourceId,
        observation_text: 'Expected to work 12+ hour days without overtime compensation',
        interpretation: 'Systemic unpaid overtime normalized through cultural framing',
        method: 'direct_quote',
        scope: 'individual_experience',
        evidence_level: 'C',
        limitations: 'Single account, no corroborating sources',
        confidence: 0.6,
        supporting_evidence_ids: [],
        counterevidence_ids: [],
        alternative_explanation_ids: []
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    evidenceId = body.id;
    expect(body.evidence_level).toBe('C');
    expect(body.confidence).toBe(0.6);
  });

  it('POST /api/claims - create claim', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/claims',
      payload: {
        evidence_ids: [evidenceId],
        claim_text: 'Employees at Karachi Tech Company report systemic unpaid overtime framed as startup culture',
        claim_type: 'reported_allegation',
        geographic_scope: 'Karachi, Pakistan',
        industry_scope: 'Technology',
        employer_scope: 'Karachi Tech Company',
        confidence: 0.55,
        uncertainty_notes: 'Only one source; no company response obtained',
        reviewer_decision: 'flagged_for_review',
        review_reason: 'Needs corroboration before elevation'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    claimId = body.id;
    expect(body.claim_type).toBe('reported_allegation');
    expect(body.reviewer_decision).toBe('flagged_for_review');
  });

  it('POST /api/alternative-explanations - add alternative', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/alternative-explanations',
      payload: {
        claim_id: claimId,
        explanation_text: 'Employees may voluntarily work longer hours due to personal ambition',
        plausibility: 'medium',
        supporting_evidence_ids: [],
        status: 'active'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    altExpId = body.id;
    expect(body.plausibility).toBe('medium');
  });

  it('POST /api/topics - create topic', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/topics',
      payload: {
        claim_ids: [claimId],
        source_ids: [sourceId],
        priority_rationale: 'High recurrence in Karachi tech reviews; labor law implications',
        status: 'active'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    topicId = body.id;
    expect(body.status).toBe('active');
  });

  it('POST /api/research-briefs - create brief', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/research-briefs',
      payload: {
        topic_id: topicId,
        findings: [{ claim_id: claimId, summary: 'Unpaid overtime reported at Karachi Tech Company', evidence_level: 'C' }],
        uncertainties: ['Single source only', 'No company response'],
        gaps: ['Need corroborating reviews', 'Need labor law analysis'],
        claim_to_evidence_map: { [claimId]: [evidenceId] }
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    briefId = body.id;
    expect(body.findings.length).toBe(1);
  });

  it('POST /api/linkedin-drafts - create draft with validation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/linkedin-drafts',
      payload: {
        brief_id: briefId,
        content_text: 'Unpaid overtime is a real issue in Karachi\'s tech sector. Employees report 12+ hour days without compensation, framed as "startup culture." This needs to change.',
        claim_to_source_map: [{
          claim_text: 'Unpaid overtime reported at Karachi Tech Company',
          source_ids: [sourceId],
          evidence_level: 'C',
          is_supported: true
        }]
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    draftId = body.id;
    expect(body.risk_flags.length).toBeGreaterThan(0);
    expect(body.risk_flags.some((f: any) => f.type === 'single_source')).toBe(true);
    expect(body.validation_status).toBe('failed');
  });

  it('PATCH /api/linkedin-drafts/:id - owner approval', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/linkedin-drafts/${draftId}`,
      payload: {
        owner_decision: 'approved',
        owner_notes: 'Approved for review after adding disclaimer about single source'
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.owner_decision).toBe('approved');
  });

  it('POST /api/conflicts - create conflict', async () => {
    // Create another claim for conflict
    const claim2Id = `claim_${uuidv4().slice(0, 8)}`;
    repo.claims.create.run(
      claim2Id, '1.0.0', 'claim', 1, 'Test', now(), now(), 'test', 0, 'draft', null, null, 'Test',
      JSON.stringify([evidenceId]), 'Company denies unpaid overtime', 'reported_allegation', 'Karachi', 'Tech', 'Karachi Tech', 0.5, null, null, null
    );

    const res = await app.inject({
      method: 'POST',
      url: '/api/conflicts',
      payload: {
        competing_claim_ids: [claimId, claim2Id],
        evidence_for_each: { [claimId]: [evidenceId], [claim2Id]: [evidenceId] },
        state: 'open'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.state).toBe('open');
    expect(body.competing_claim_ids.length).toBe(2);
  });

  it('POST /api/references - add reference', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/references',
      payload: {
        source_id: sourceId,
        mechanism: 'citation',
        use_context: 'Primary source for unpaid overtime claim',
        originality_note: 'Original employee review'
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.mechanism).toBe('citation');
  });

  it('should reject unsupported claim in draft', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/linkedin-drafts',
      payload: {
        brief_id: briefId,
        content_text: 'Test',
        claim_to_source_map: [{
          claim_text: 'Non-existent claim',
          source_ids: [],
          evidence_level: 'A',
          is_supported: false
        }]
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.risk_flags.some((f: any) => f.type === 'unsupported_claim')).toBe(true);
  });

  it('should flag named employer with single source', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/linkedin-drafts',
      payload: {
        brief_id: briefId,
        content_text: 'Test',
        claim_to_source_map: [{
          claim_text: 'Unpaid overtime reported at Karachi Tech Company',
          source_ids: [sourceId],
          evidence_level: 'C',
          is_supported: true
        }]
      }
    });
    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.risk_flags.some((f: any) => f.type === 'named_employer_threshold')).toBe(true);
  });

  console.log('✓ All API tests passed');
});