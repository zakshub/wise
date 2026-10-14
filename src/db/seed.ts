import { v4 as uuidv4 } from 'uuid';
import { repo } from './repository.js';

function now(): string { return new Date().toISOString(); }

const OWNER = 'owner';

function baseFields(type: string, title: string) {
  return {
    schema_version: '1.0.0',
    id: `${type}_${uuidv4().slice(0, 8)}`,
    type,
    revision: 1,
    title,
    created_at: now(),
    updated_at: now(),
    created_by: OWNER,
    fixture: false,
    lifecycle: 'draft' as const,
    review: null,
    review_due_at: null,
    change_reason: 'Initial creation'
  };
}

export function seed(): void {
  const source = {
    ...baseFields('source', 'Glassdoor Review - Karachi Tech Company'),
    url: 'https://glassdoor.com/reviews/karachi-tech-company',
    source_type: 'review_platform',
    publisher: 'Glassdoor',
    author: 'Anonymous Employee',
    published_at: '2024-01-15T10:00:00Z',
    accessed_at: now(),
    geographic_context: 'Karachi, Pakistan',
    industry_context: 'Technology',
    employer_context: 'Karachi Tech Company',
    availability_status: 'accessible',
    extraction_method: 'manual',
    reliability_notes: 'Single anonymous review, no verification',
    limitations: 'Cannot verify employment dates or role',
    independence_group: 'glassdoor_karachi_tech'
  };

  const evidence = {
    ...baseFields('evidence', 'Unpaid Overtime Allegation'),
    source_id: source.id,
    observation_text: 'Expected to work 12+ hour days without overtime compensation. Management says "this is startup culture."',
    interpretation: 'Systemic unpaid overtime normalized through cultural framing',
    method: 'direct_quote',
    scope: 'individual_experience',
    evidence_level: 'C',
    limitations: 'Single account, no corroborating sources',
    confidence: 0.6,
    supporting_evidence_ids: [],
    counterevidence_ids: [],
    alternative_explanation_ids: []
  };

  const claim = {
    ...baseFields('claim', 'Unpaid Overtime Pattern'),
    evidence_ids: [evidence.id],
    claim_text: 'Employees at Karachi Tech Company report systemic unpaid overtime framed as "startup culture"',
    claim_type: 'reported_allegation',
    geographic_scope: 'Karachi, Pakistan',
    industry_scope: 'Technology',
    employer_scope: 'Karachi Tech Company',
    confidence: 0.55,
    uncertainty_notes: 'Only one source; no company response obtained',
    reviewer_decision: 'flagged_for_review',
    review_reason: 'Needs corroboration before elevation'
  };

  const altExp = {
    ...baseFields('alternative_explanation', 'Voluntary Extended Hours'),
    claim_id: claim.id,
    explanation_text: 'Employees may voluntarily work longer hours due to personal ambition or project deadlines',
    plausibility: 'medium',
    supporting_evidence_ids: [],
    status: 'active'
  };

  const topic = {
    ...baseFields('topic', 'Unpaid Overtime in Karachi Tech'),
    claim_ids: [claim.id],
    source_ids: [source.id],
    priority_rationale: 'High recurrence in Karachi tech reviews; labor law implications',
    status: 'active'
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

  repo.claims.create.run(
    claim.id, claim.schema_version, claim.type, claim.revision, claim.title,
    claim.created_at, claim.updated_at, claim.created_by, claim.fixture ? 1 : 0,
    claim.lifecycle, claim.review ? JSON.stringify(claim.review) : null,
    claim.review_due_at, claim.change_reason,
    JSON.stringify(claim.evidence_ids), claim.claim_text, claim.claim_type,
    claim.geographic_scope, claim.industry_scope, claim.employer_scope,
    claim.confidence, claim.uncertainty_notes, claim.reviewer_decision, claim.review_reason
  );

  repo.alternative_explanations.create.run(
    altExp.id, altExp.schema_version, altExp.type, altExp.revision, altExp.title,
    altExp.created_at, altExp.updated_at, altExp.created_by, altExp.fixture ? 1 : 0,
    altExp.lifecycle, altExp.review ? JSON.stringify(altExp.review) : null,
    altExp.review_due_at, altExp.change_reason,
    altExp.claim_id, altExp.explanation_text, altExp.plausibility,
    JSON.stringify(altExp.supporting_evidence_ids), altExp.status
  );

  repo.topics.create.run(
    topic.id, topic.schema_version, topic.type, topic.revision, topic.title,
    topic.created_at, topic.updated_at, topic.created_by, topic.fixture ? 1 : 0,
    topic.lifecycle, topic.review ? JSON.stringify(topic.review) : null,
    topic.review_due_at, topic.change_reason,
    JSON.stringify(topic.claim_ids), JSON.stringify(topic.source_ids),
    topic.priority_rationale, topic.status
  );

  console.log('Seeded demo data');
}