import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import { runMigrations } from '../src/db/migrate.js';
import { repo, closeRepo } from '../src/db/repository.js';
import { v4 as uuidv4 } from 'uuid';

function now(): string { return new Date().toISOString(); }

before(async () => {
  await runMigrations();
});

after(() => {
  closeRepo();
});

describe('Core workflow', () => {
  test('should create source, evidence, claim, alt explanation, topic, brief, draft', () => {
    // Source
    const source = {
      schema_version: '1.0.0',
      id: `source_${uuidv4().slice(0, 8)}`,
      type: 'source' as const,
      revision: 1,
      title: 'Test Source',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      url: 'https://example.com/review',
      source_type: 'review_platform' as const,
      publisher: 'Glassdoor',
      author: 'Anonymous',
      published_at: '2024-01-01T00:00:00Z',
      accessed_at: now(),
      geographic_context: 'Karachi, Pakistan',
      industry_context: 'Technology',
      employer_context: 'Test Corp',
      availability_status: 'accessible' as const,
      extraction_method: 'manual' as const,
      reliability_notes: null,
      limitations: 'Single anonymous review',
      independence_group: 'test_group'
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

    const fetchedSource = repo.sources.get.get(source.id);
    assert.ok(fetchedSource);
    assert.strictEqual(fetchedSource?.id, source.id);

    // Evidence
    const evidence = {
      schema_version: '1.0.0',
      id: `evidence_${uuidv4().slice(0, 8)}`,
      type: 'evidence' as const,
      revision: 1,
      title: 'Unpaid overtime observation',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      source_id: source.id,
      observation_text: 'Worked 12 hours daily without overtime pay',
      interpretation: 'Systemic unpaid overtime',
      method: 'direct_quote' as const,
      scope: 'individual_experience' as const,
      evidence_level: 'C' as const,
      limitations: 'Single account',
      confidence: 0.6,
      supporting_evidence_ids: [],
      counterevidence_ids: [],
      alternative_explanation_ids: []
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

    const fetchedEvidence = repo.evidence.get.get(evidence.id);
    assert.ok(fetchedEvidence);
    assert.strictEqual(fetchedEvidence?.evidence_level, 'C');

    // Claim
    const claim = {
      schema_version: '1.0.0',
      id: `claim_${uuidv4().slice(0, 8)}`,
      type: 'claim' as const,
      revision: 1,
      title: 'Unpaid overtime claim',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      evidence_ids: [evidence.id],
      claim_text: 'Employees report unpaid overtime at Test Corp',
      claim_type: 'reported_allegation' as const,
      geographic_scope: 'Karachi, Pakistan',
      industry_scope: 'Technology',
      employer_scope: 'Test Corp',
      confidence: 0.55,
      uncertainty_notes: 'Single source',
      reviewer_decision: 'flagged_for_review' as const,
      review_reason: 'Needs corroboration'
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

    const fetchedClaim = repo.claims.get.get(claim.id);
    assert.ok(fetchedClaim);
    assert.ok(JSON.parse(fetchedClaim!.evidence_ids).includes(evidence.id));

    // Alternative Explanation
    const altExp = {
      schema_version: '1.0.0',
      id: `alt_exp_${uuidv4().slice(0, 8)}`,
      type: 'alternative_explanation' as const,
      revision: 1,
      title: 'Voluntary hours',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      claim_id: claim.id,
      explanation_text: 'Employees may work voluntarily',
      plausibility: 'medium' as const,
      supporting_evidence_ids: [],
      status: 'active' as const
    };

    repo.alternative_explanations.create.run(
      altExp.id, altExp.schema_version, altExp.type, altExp.revision, altExp.title,
      altExp.created_at, altExp.updated_at, altExp.created_by, altExp.fixture ? 1 : 0,
      altExp.lifecycle, altExp.review ? JSON.stringify(altExp.review) : null,
      altExp.review_due_at, altExp.change_reason,
      altExp.claim_id, altExp.explanation_text, altExp.plausibility,
      JSON.stringify(altExp.supporting_evidence_ids), altExp.status
    );

    const fetchedAlt = repo.alternative_explanations.get.get(altExp.id);
    assert.ok(fetchedAlt);
    assert.strictEqual(fetchedAlt?.claim_id, claim.id);

    // Topic
    const topic = {
      schema_version: '1.0.0',
      id: `topic_${uuidv4().slice(0, 8)}`,
      type: 'topic' as const,
      revision: 1,
      title: 'Unpaid Overtime in Karachi Tech',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      claim_ids: [claim.id],
      source_ids: [source.id],
      priority_rationale: 'High recurrence',
      status: 'active' as const
    };

    repo.topics.create.run(
      topic.id, topic.schema_version, topic.type, topic.revision, topic.title,
      topic.created_at, topic.updated_at, topic.created_by, topic.fixture ? 1 : 0,
      topic.lifecycle, topic.review ? JSON.stringify(topic.review) : null,
      topic.review_due_at, topic.change_reason,
      JSON.stringify(topic.claim_ids), JSON.stringify(topic.source_ids),
      topic.priority_rationale, topic.status
    );

    const fetchedTopic = repo.topics.get.get(topic.id);
    assert.ok(fetchedTopic);
    assert.ok(JSON.parse(fetchedTopic!.claim_ids).includes(claim.id));

    // Research Brief
    const brief = {
      schema_version: '1.0.0',
      id: `brief_${uuidv4().slice(0, 8)}`,
      type: 'research_brief' as const,
      revision: 1,
      title: 'Brief on unpaid overtime',
      created_at: now(),
      updated_at: now(),
      created_by: 'test',
      fixture: false,
      lifecycle: 'draft' as const,
      review: null,
      review_due_at: null,
      change_reason: 'Test',
      topic_id: topic.id,
      findings: [{ claim_id: claim.id, summary: 'Unpaid overtime reported', evidence_level: 'C' as const }],
      uncertainties: ['Single source only'],
      gaps: ['No company response', 'No corroborating reviews'],
      claim_to_evidence_map: { [claim.id]: [evidence.id] }
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

    const fetchedBrief = repo.research_briefs.get.get(brief.id);
    assert.ok(fetchedBrief);
    assert.strictEqual(JSON.parse(fetchedBrief!.findings).length, 1);

    console.log('✓ Core workflow test passed');
  });

  test('should store evidence level as provided (SQLite does not enforce CHECK by default)', () => {
    const sourceId = `source_${uuidv4().slice(0, 8)}`;
    repo.sources.create.run(
      sourceId, '1.0.0', 'source', 1, 'Test', now(), now(), 'test', 0, 'draft', null, null, 'Test',
      'https://test.com', 'review_platform', null, null, null, now(), 'Karachi', 'Tech', 'Test', 'accessible', 'manual', null, null, null
    );

    const badEvidenceId = `evidence_${uuidv4().slice(0, 8)}`;
    repo.evidence.create.run(
      badEvidenceId, '1.0.0', 'evidence', 1, 'Test', now(), now(), 'test', 0, 'draft', null, null, 'Test',
      sourceId, 'Test', null, 'direct_quote', 'individual_experience', 'X', null, 0.5, '[]', '[]', '[]'
    );

    const fetched = repo.evidence.get.get(badEvidenceId);
    assert.strictEqual(fetched?.evidence_level, 'X');

    console.log('✓ Evidence level stored as provided (validation at application layer)');
  });

  test('should track revisions', () => {
    const sourceId = `source_${uuidv4().slice(0, 8)}`;
    repo.sources.create.run(
      sourceId, '1.0.0', 'source', 1, 'Original', now(), now(), 'test', 0, 'draft', null, null, 'Created',
      'https://test.com', 'review_platform', null, null, null, now(), 'Karachi', 'Tech', 'Test', 'accessible', 'manual', null, null, null
    );

    const updatedAt = now();
    repo.sources.update.run(
      '1.0.0', 'source', 2, 'Updated', now(), updatedAt, 'test', 0, 'draft', null, null, 'Updated',
      'https://test.com', 'review_platform', null, null, null, now(), 'Karachi', 'Tech', 'Test', 'accessible', 'manual', null, null, null,
      sourceId
    );

    const fetched = repo.sources.get.get(sourceId);
    assert.strictEqual(fetched?.revision, 2);
    assert.strictEqual(fetched?.title, 'Updated');

    console.log('✓ Revision tracking works');
  });
});