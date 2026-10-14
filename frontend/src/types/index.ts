export interface Source {
  id: string;
  schema_version: string;
  type: 'source';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  url: string;
  source_type: 'review_platform' | 'news' | 'government' | 'academic' | 'company_statement' | 'forum' | 'social_media' | 'other';
  publisher: string | null;
  author: string | null;
  published_at: string | null;
  accessed_at: string;
  geographic_context: string | null;
  industry_context: string | null;
  employer_context: string | null;
  availability_status: 'accessible' | 'paywall' | 'login_required' | 'rate_limited' | 'blocked' | 'removed' | 'unknown';
  extraction_method: 'manual' | 'api' | 'rss' | 'html_scrape' | 'other';
  reliability_notes: string | null;
  limitations: string | null;
  independence_group: string | null;
}

export interface Evidence {
  id: string;
  schema_version: string;
  type: 'evidence';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  source_id: string;
  observation_text: string;
  interpretation: string | null;
  method: 'direct_quote' | 'paraphrase' | 'inference' | 'statistical_extract' | 'other';
  scope: 'individual_experience' | 'team_pattern' | 'organization_wide' | 'industry_wide' | 'geographic_region';
  evidence_level: 'A' | 'B' | 'C' | 'D';
  limitations: string | null;
  confidence: number;
  supporting_evidence_ids: string[];
  counterevidence_ids: string[];
  alternative_explanation_ids: string[];
}

export interface Claim {
  id: string;
  schema_version: string;
  type: 'claim';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  evidence_ids: string[];
  claim_text: string;
  claim_type: 'factual_statement' | 'reported_allegation' | 'corroborated_pattern' | 'analytical_interpretation' | 'hypothesis' | 'model_suggestion' | 'owner_approved_conclusion';
  geographic_scope: string | null;
  industry_scope: string | null;
  employer_scope: string | null;
  confidence: number;
  uncertainty_notes: string | null;
  reviewer_decision: 'accepted' | 'rejected' | 'needs_more_evidence' | 'flagged_for_review' | null;
  review_reason: string | null;
}

export interface AlternativeExplanation {
  id: string;
  schema_version: string;
  type: 'alternative_explanation';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  claim_id: string;
  explanation_text: string;
  plausibility: 'high' | 'medium' | 'low' | 'speculative';
  supporting_evidence_ids: string[];
  status: 'active' | 'dismissed' | 'needs_investigation';
}

export interface Topic {
  id: string;
  schema_version: string;
  type: 'topic';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  claim_ids: string[];
  source_ids: string[];
  priority_rationale: string | null;
  status: 'active' | 'archived' | 'on_hold';
}

export interface ResearchBrief {
  id: string;
  schema_version: string;
  type: 'research_brief';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  topic_id: string;
  findings: Array<{ claim_id: string; summary: string; evidence_level: 'A' | 'B' | 'C' | 'D' }>;
  uncertainties: string[];
  gaps: string[];
  claim_to_evidence_map: Record<string, string[]>;
}

export interface LinkedInDraft {
  id: string;
  schema_version: string;
  type: 'linkedin_draft';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  brief_id: string;
  content_text: string;
  claim_to_source_map: Array<{
    claim_text: string;
    source_ids: string[];
    evidence_level: 'A' | 'B' | 'C' | 'D';
    is_supported: boolean;
  }>;
  risk_flags: RiskFlag[];
  validation_status: 'pending' | 'passed' | 'failed';
  owner_decision: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  owner_notes: string | null;
}

export interface RiskFlag {
  type: 'unsupported_claim' | 'named_employer_threshold' | 'missing_context' | 'single_source' | 'legal_sensitivity' | 'personal_data';
  description: string;
  severity: 'low' | 'medium' | 'high' | 'blocking';
}

export interface Conflict {
  id: string;
  schema_version: string;
  type: 'conflict';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  competing_claim_ids: string[];
  evidence_for_each: Record<string, string[]>;
  state: 'open' | 'resolved' | 'deferred';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface Reference {
  id: string;
  schema_version: string;
  type: 'reference';
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: 'draft' | 'active' | 'superseded' | 'retired';
  review: Review | null;
  review_due_at: string | null;
  change_reason: string;
  source_id: string;
  mechanism: 'citation' | 'corroboration' | 'counterevidence' | 'context' | 'methodology';
  use_context: string;
  originality_note: string | null;
}

export interface Review {
  actor: string;
  actor_kind: 'human' | 'fixture';
  decision: 'approved' | 'rejected' | 'needs_revision';
  time: string;
  reason: string;
}

export type EntityType = 'source' | 'evidence' | 'claim' | 'alternative_explanation' | 'topic' | 'research_brief' | 'linkedin_draft' | 'conflict' | 'reference';

export const ENTITY_LABELS: Record<EntityType, string> = {
  source: 'Source',
  evidence: 'Evidence',
  claim: 'Claim',
  alternative_explanation: 'Alt. Explanation',
  topic: 'Topic',
  research_brief: 'Research Brief',
  linkedin_draft: 'LinkedIn Draft',
  conflict: 'Conflict',
  reference: 'Reference'
};

export const EVIDENCE_LEVEL_LABELS: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'Strong Evidence',
  B: 'Corroborated',
  C: 'Individual Report',
  D: 'Hypothesis'
};

export const CLAIM_TYPE_LABELS: Record<Claim['claim_type'], string> = {
  factual_statement: 'Factual Statement',
  reported_allegation: 'Reported Allegation',
  corroborated_pattern: 'Corroborated Pattern',
  analytical_interpretation: 'Analytical Interpretation',
  hypothesis: 'Hypothesis',
  model_suggestion: 'Model Suggestion',
  owner_approved_conclusion: 'Owner Approved'
};