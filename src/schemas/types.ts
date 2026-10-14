import type { SchemaType, EvidenceLevel, ClaimType, SourceType, AvailabilityStatus, LifecycleState } from './index.js';

export interface CommonFields {
  schema_version: string;
  id: string;
  type: SchemaType;
  revision: number;
  title: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  fixture: boolean;
  lifecycle: LifecycleState;
  review: {
    actor: string;
    actor_kind: 'human' | 'fixture';
    decision: 'approved' | 'rejected' | 'needs_revision';
    time: string;
    reason: string;
  } | null;
  review_due_at: string | null;
  change_reason: string;
}

export interface Source extends CommonFields {
  type: 'source';
  url: string;
  source_type: SourceType;
  publisher: string | null;
  author: string | null;
  published_at: string | null;
  accessed_at: string;
  geographic_context: string | null;
  industry_context: string | null;
  employer_context: string | null;
  availability_status: AvailabilityStatus;
  extraction_method: 'manual' | 'api' | 'rss' | 'html_scrape' | 'other';
  reliability_notes: string | null;
  limitations: string | null;
  independence_group: string | null;
}

export interface Evidence extends CommonFields {
  type: 'evidence';
  source_id: string;
  observation_text: string;
  interpretation: string | null;
  method: 'direct_quote' | 'paraphrase' | 'inference' | 'statistical_extract' | 'other';
  scope: 'individual_experience' | 'team_pattern' | 'organization_wide' | 'industry_wide' | 'geographic_region';
  evidence_level: EvidenceLevel;
  limitations: string | null;
  confidence: number;
  supporting_evidence_ids: string[];
  counterevidence_ids: string[];
  alternative_explanation_ids: string[];
}

export interface Claim extends CommonFields {
  type: 'claim';
  evidence_ids: string[];
  claim_text: string;
  claim_type: ClaimType;
  geographic_scope: string | null;
  industry_scope: string | null;
  employer_scope: string | null;
  confidence: number;
  uncertainty_notes: string | null;
  reviewer_decision: 'accepted' | 'rejected' | 'needs_more_evidence' | 'flagged_for_review' | null;
  review_reason: string | null;
}

export interface AlternativeExplanation extends CommonFields {
  type: 'alternative_explanation';
  claim_id: string;
  explanation_text: string;
  plausibility: 'high' | 'medium' | 'low' | 'speculative';
  supporting_evidence_ids: string[];
  status: 'active' | 'dismissed' | 'needs_investigation';
}

export interface Topic extends CommonFields {
  type: 'topic';
  claim_ids: string[];
  source_ids: string[];
  priority_rationale: string | null;
  status: 'active' | 'archived' | 'on_hold';
}

export interface ResearchBrief extends CommonFields {
  type: 'research_brief';
  topic_id: string;
  findings: Array<{
    claim_id: string;
    summary: string;
    evidence_level: EvidenceLevel;
  }>;
  uncertainties: string[];
  gaps: string[];
  claim_to_evidence_map: Record<string, string[]>;
}

export interface LinkedInDraft extends CommonFields {
  type: 'linkedin_draft';
  brief_id: string;
  content_text: string;
  claim_to_source_map: Array<{
    claim_text: string;
    source_ids: string[];
    evidence_level: EvidenceLevel;
    is_supported: boolean;
  }>;
  risk_flags: Array<{
    type: 'unsupported_claim' | 'named_employer_threshold' | 'missing_context' | 'single_source' | 'legal_sensitivity' | 'personal_data';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'blocking';
  }>;
  validation_status: 'pending' | 'passed' | 'failed';
  owner_decision: 'pending' | 'approved' | 'rejected' | 'needs_revision';
  owner_notes: string | null;
}

export interface Conflict extends CommonFields {
  type: 'conflict';
  competing_claim_ids: string[];
  evidence_for_each: Record<string, string[]>;
  state: 'open' | 'resolved' | 'deferred';
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
}

export interface Reference extends CommonFields {
  type: 'reference';
  source_id: string;
  mechanism: 'citation' | 'corroboration' | 'counterevidence' | 'context' | 'methodology';
  use_context: string;
  originality_note: string | null;
}

export type AnyRecord =
  | Source
  | Evidence
  | Claim
  | AlternativeExplanation
  | Topic
  | ResearchBrief
  | LinkedInDraft
  | Conflict
  | Reference;

export function isSource(r: AnyRecord): r is Source { return r.type === 'source'; }
export function isEvidence(r: AnyRecord): r is Evidence { return r.type === 'evidence'; }
export function isClaim(r: AnyRecord): r is Claim { return r.type === 'claim'; }
export function isAlternativeExplanation(r: AnyRecord): r is AlternativeExplanation { return r.type === 'alternative_explanation'; }
export function isTopic(r: AnyRecord): r is Topic { return r.type === 'topic'; }
export function isResearchBrief(r: AnyRecord): r is ResearchBrief { return r.type === 'research_brief'; }
export function isLinkedInDraft(r: AnyRecord): r is LinkedInDraft { return r.type === 'linkedin_draft'; }
export function isConflict(r: AnyRecord): r is Conflict { return r.type === 'conflict'; }
export function isReference(r: AnyRecord): r is Reference { return r.type === 'reference'; }