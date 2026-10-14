import { getDatabaseSync, saveDatabase, getDatabase } from './client.js';
import type { Source, Evidence, Claim, AlternativeExplanation, Topic, ResearchBrief, LinkedInDraft, Conflict, Reference } from '../schemas/types.js';

function jsonParse<T>(val: string | null | undefined, fallback: T): T {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function parseSource(row: any): Source {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    publisher: row.publisher ?? null,
    author: row.author ?? null,
    published_at: row.published_at ?? null,
    geographic_context: row.geographic_context ?? null,
    industry_context: row.industry_context ?? null,
    employer_context: row.employer_context ?? null,
    reliability_notes: row.reliability_notes ?? null,
    limitations: row.limitations ?? null,
    independence_group: row.independence_group ?? null
  };
}

function parseEvidence(row: any): Evidence {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    interpretation: row.interpretation ?? null,
    limitations: row.limitations ?? null,
    supporting_evidence_ids: jsonParse(row.supporting_evidence_ids, []),
    counterevidence_ids: jsonParse(row.counterevidence_ids, []),
    alternative_explanation_ids: jsonParse(row.alternative_explanation_ids, [])
  };
}

function parseClaim(row: any): Claim {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    evidence_ids: jsonParse(row.evidence_ids, []),
    geographic_scope: row.geographic_scope ?? null,
    industry_scope: row.industry_scope ?? null,
    employer_scope: row.employer_scope ?? null,
    uncertainty_notes: row.uncertainty_notes ?? null,
    reviewer_decision: row.reviewer_decision ?? null,
    review_reason: row.review_reason ?? null
  };
}

function parseAltExp(row: any): AlternativeExplanation {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    supporting_evidence_ids: jsonParse(row.supporting_evidence_ids, [])
  };
}

function parseTopic(row: any): Topic {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    claim_ids: jsonParse(row.claim_ids, []),
    source_ids: jsonParse(row.source_ids, []),
    priority_rationale: row.priority_rationale ?? null
  };
}

function parseBrief(row: any): ResearchBrief {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    findings: jsonParse(row.findings, []),
    uncertainties: jsonParse(row.uncertainties, []),
    gaps: jsonParse(row.gaps, []),
    claim_to_evidence_map: jsonParse(row.claim_to_evidence_map, {})
  };
}

function parseDraft(row: any): LinkedInDraft {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    claim_to_source_map: jsonParse(row.claim_to_source_map, []),
    risk_flags: jsonParse(row.risk_flags, []),
    owner_notes: row.owner_notes ?? null
  };
}

function parseConflict(row: any): Conflict {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    competing_claim_ids: jsonParse(row.competing_claim_ids, []),
    evidence_for_each: jsonParse(row.evidence_for_each, {}),
    resolution: row.resolution ?? null,
    resolved_by: row.resolved_by ?? null,
    resolved_at: row.resolved_at ?? null
  };
}

function parseReference(row: any): Reference {
  return {
    ...row,
    fixture: Boolean(row.fixture),
    review: row.review ? jsonParse(row.review, null) : null,
    originality_note: row.originality_note ?? null
  };
}

class StmtWrapper {
  private stmt: any;
  private sql: string;

  constructor(sql: string) {
    this.sql = sql;
  }

  private getStmt() {
    if (!this.stmt) {
      const db = getDatabaseSync();
      this.stmt = db.prepare(this.sql);
    }
    return this.stmt;
  }

  run(...params: any[]): { changes: number; lastInsertRowid: number } {
    const stmt = this.getStmt();
    stmt.bind(params);
    stmt.step();
    stmt.reset();
    return { changes: 1, lastInsertRowid: 0 };
  }

  get(...params: any[]): any | undefined {
    const stmt = this.getStmt();
    stmt.bind(params);
    const result = stmt.step() ? stmt.getAsObject() : undefined;
    stmt.reset();
    return result;
  }

  all(...params: any[]): any[] {
    const stmt = this.getStmt();
    stmt.bind(params);
    const results: any[] = [];
    while (stmt.step()) {
      results.push(stmt.getAsObject());
    }
    stmt.reset();
    return results;
  }
}

function createStmt(table: string, columns: string[]): StmtWrapper {
  const placeholders = columns.map(() => '?').join(', ');
  const colNames = columns.join(', ');
  return new StmtWrapper(`INSERT INTO ${table} (${colNames}) VALUES (${placeholders})`);
}

function createUpdateStmt(table: string, columns: string[]): StmtWrapper {
  const setClause = columns.map(c => `${c}=?`).join(', ');
  return new StmtWrapper(`UPDATE ${table} SET ${setClause} WHERE id=?`);
}

function createSelectStmt(sql: string): StmtWrapper {
  return new StmtWrapper(sql);
}

const sourceCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'url', 'source_type', 'publisher', 'author', 'published_at', 'accessed_at', 'geographic_context', 'industry_context', 'employer_context', 'availability_status', 'extraction_method', 'reliability_notes', 'limitations', 'independence_group'];
const evidenceCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'source_id', 'observation_text', 'interpretation', 'method', 'scope', 'evidence_level', 'limitations', 'confidence', 'supporting_evidence_ids', 'counterevidence_ids', 'alternative_explanation_ids'];
const claimCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'evidence_ids', 'claim_text', 'claim_type', 'geographic_scope', 'industry_scope', 'employer_scope', 'confidence', 'uncertainty_notes', 'reviewer_decision', 'review_reason'];
const altExpCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'claim_id', 'explanation_text', 'plausibility', 'supporting_evidence_ids', 'status'];
const topicCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'claim_ids', 'source_ids', 'priority_rationale', 'status'];
const briefCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'topic_id', 'findings', 'uncertainties', 'gaps', 'claim_to_evidence_map'];
const draftCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'brief_id', 'content_text', 'claim_to_source_map', 'risk_flags', 'validation_status', 'owner_decision', 'owner_notes'];
const conflictCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'competing_claim_ids', 'evidence_for_each', 'state', 'resolution', 'resolved_by', 'resolved_at'];
const refCols = ['id', 'schema_version', 'type', 'revision', 'title', 'created_at', 'updated_at', 'created_by', 'fixture', 'lifecycle', 'review', 'review_due_at', 'change_reason', 'source_id', 'mechanism', 'use_context', 'originality_note'];

const repo = {
  sources: {
    create: createStmt('sources', sourceCols),
    get: createSelectStmt('SELECT * FROM sources WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM sources ORDER BY created_at DESC'),
    update: createUpdateStmt('sources', sourceCols.slice(1)),
    delete: createSelectStmt('DELETE FROM sources WHERE id = ?'),
    getByEmployer: createSelectStmt('SELECT * FROM sources WHERE employer_context = ? ORDER BY created_at DESC'),
    getByGeographic: createSelectStmt('SELECT * FROM sources WHERE geographic_context = ? ORDER BY created_at DESC'),
    parse: parseSource
  },
  evidence: {
    create: createStmt('evidence', evidenceCols),
    get: createSelectStmt('SELECT * FROM evidence WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM evidence ORDER BY created_at DESC'),
    update: createUpdateStmt('evidence', evidenceCols.slice(1)),
    delete: createSelectStmt('DELETE FROM evidence WHERE id = ?'),
    getBySource: createSelectStmt('SELECT * FROM evidence WHERE source_id = ? ORDER BY created_at DESC'),
    getByLevel: createSelectStmt('SELECT * FROM evidence WHERE evidence_level = ? ORDER BY created_at DESC'),
    parse: parseEvidence
  },
  claims: {
    create: createStmt('claims', claimCols),
    get: createSelectStmt('SELECT * FROM claims WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM claims ORDER BY created_at DESC'),
    update: createUpdateStmt('claims', claimCols.slice(1)),
    delete: createSelectStmt('DELETE FROM claims WHERE id = ?'),
    getByEmployer: createSelectStmt('SELECT * FROM claims WHERE employer_scope = ? ORDER BY created_at DESC'),
    getByType: createSelectStmt('SELECT * FROM claims WHERE claim_type = ? ORDER BY created_at DESC'),
    parse: parseClaim
  },
  alternative_explanations: {
    create: createStmt('alternative_explanations', altExpCols),
    get: createSelectStmt('SELECT * FROM alternative_explanations WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM alternative_explanations ORDER BY created_at DESC'),
    update: createUpdateStmt('alternative_explanations', altExpCols.slice(1)),
    delete: createSelectStmt('DELETE FROM alternative_explanations WHERE id = ?'),
    getByClaim: createSelectStmt('SELECT * FROM alternative_explanations WHERE claim_id = ? ORDER BY created_at DESC'),
    parse: parseAltExp
  },
  topics: {
    create: createStmt('topics', topicCols),
    get: createSelectStmt('SELECT * FROM topics WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM topics ORDER BY created_at DESC'),
    update: createUpdateStmt('topics', topicCols.slice(1)),
    delete: createSelectStmt('DELETE FROM topics WHERE id = ?'),
    getByStatus: createSelectStmt('SELECT * FROM topics WHERE status = ? ORDER BY created_at DESC'),
    parse: parseTopic
  },
  research_briefs: {
    create: createStmt('research_briefs', briefCols),
    get: createSelectStmt('SELECT * FROM research_briefs WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM research_briefs ORDER BY created_at DESC'),
    update: createUpdateStmt('research_briefs', briefCols.slice(1)),
    delete: createSelectStmt('DELETE FROM research_briefs WHERE id = ?'),
    getByTopic: createSelectStmt('SELECT * FROM research_briefs WHERE topic_id = ? ORDER BY created_at DESC'),
    parse: parseBrief
  },
  linkedin_drafts: {
    create: createStmt('linkedin_drafts', draftCols),
    get: createSelectStmt('SELECT * FROM linkedin_drafts WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM linkedin_drafts ORDER BY created_at DESC'),
    update: createUpdateStmt('linkedin_drafts', draftCols.slice(1)),
    delete: createSelectStmt('DELETE FROM linkedin_drafts WHERE id = ?'),
    getByBrief: createSelectStmt('SELECT * FROM linkedin_drafts WHERE brief_id = ? ORDER BY created_at DESC'),
    getByDecision: createSelectStmt('SELECT * FROM linkedin_drafts WHERE owner_decision = ? ORDER BY created_at DESC'),
    parse: parseDraft
  },
  conflicts: {
    create: createStmt('conflicts', conflictCols),
    get: createSelectStmt('SELECT * FROM conflicts WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM conflicts ORDER BY created_at DESC'),
    update: createUpdateStmt('conflicts', conflictCols.slice(1)),
    delete: createSelectStmt('DELETE FROM conflicts WHERE id = ?'),
    getByState: createSelectStmt('SELECT * FROM conflicts WHERE state = ? ORDER BY created_at DESC'),
    parse: parseConflict
  },
  references: {
    create: createStmt('source_references', refCols),
    get: createSelectStmt('SELECT * FROM source_references WHERE id = ?'),
    getAll: createSelectStmt('SELECT * FROM source_references ORDER BY created_at DESC'),
    update: createUpdateStmt('source_references', refCols.slice(1)),
    delete: createSelectStmt('DELETE FROM source_references WHERE id = ?'),
    getBySource: createSelectStmt('SELECT * FROM source_references WHERE source_id = ? ORDER BY created_at DESC'),
    parse: parseReference
  }
};

export { repo, getDatabase };

export function closeRepo(): void {
  saveDatabase();
}