export const SCHEMAS = {
  source: 'source.schema.json',
  evidence: 'evidence.schema.json',
  claim: 'claim.schema.json',
  alternative_explanation: 'alternative_explanation.schema.json',
  topic: 'topic.schema.json',
  research_brief: 'research_brief.schema.json',
  linkedin_draft: 'linkedin_draft.schema.json',
  conflict: 'conflict.schema.json',
  reference: 'reference.schema.json'
} as const;

export type SchemaType = keyof typeof SCHEMAS;

export const EVIDENCE_LEVELS = ['A', 'B', 'C', 'D'] as const;
export type EvidenceLevel = typeof EVIDENCE_LEVELS[number];

export const CLAIM_TYPES = [
  'factual_statement',
  'reported_allegation',
  'corroborated_pattern',
  'analytical_interpretation',
  'hypothesis',
  'model_suggestion',
  'owner_approved_conclusion'
] as const;
export type ClaimType = typeof CLAIM_TYPES[number];

export const SOURCE_TYPES = [
  'review_platform',
  'news',
  'government',
  'academic',
  'company_statement',
  'forum',
  'social_media',
  'other'
] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export const AVAILABILITY_STATUSES = [
  'accessible',
  'paywall',
  'login_required',
  'rate_limited',
  'blocked',
  'removed',
  'unknown'
] as const;
export type AvailabilityStatus = typeof AVAILABILITY_STATUSES[number];

export const LIFECYCLE_STATES = ['draft', 'active', 'superseded', 'retired'] as const;
export type LifecycleState = typeof LIFECYCLE_STATES[number];