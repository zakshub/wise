import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import { repo, getDatabase, closeRepo } from '../db/repository.js';
import type { Source, Evidence, Claim, AlternativeExplanation, Topic, ResearchBrief } from '../schemas/types.js';

function now(): string { return new Date().toISOString(); }
const OWNER = 'owner';

function baseFields<T extends string>(type: T, title: string) {
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
    change_reason: 'Created via CLI'
  } as const;
}

const program = new Command();

program
  .name('wise')
  .description('Pakistan Workplace Research Intelligence CLI')
  .version('0.1.0')
  .hook('preAction', async () => {
    await getDatabase();
  })
  .hook('postAction', async () => {
    closeRepo();
  });

interface SourceOptions {
  url: string;
  type: 'review_platform' | 'news' | 'government' | 'academic' | 'company_statement' | 'forum' | 'social_media' | 'other';
  publisher?: string;
  author?: string;
  published?: string;
  geo?: string;
  industry?: string;
  employer?: string;
  status?: 'accessible' | 'paywall' | 'login_required' | 'rate_limited' | 'blocked' | 'removed' | 'unknown';
  method?: 'manual' | 'api' | 'rss' | 'html_scrape' | 'other';
  reliability?: string;
  limitations?: string;
  independence?: string;
}

program
  .command('source:add')
  .description('Add a source')
  .requiredOption('--url <url>', 'Source URL')
  .requiredOption('--type <type>', 'Source type')
  .option('--publisher <publisher>', 'Publisher')
  .option('--author <author>', 'Author')
  .option('--published <date>', 'Published date (ISO)')
  .option('--geo <context>', 'Geographic context')
  .option('--industry <context>', 'Industry context')
  .option('--employer <context>', 'Employer context')
  .option('--status <status>', 'Availability status', 'accessible')
  .option('--method <method>', 'Extraction method', 'manual')
  .option('--reliability <notes>', 'Reliability notes')
  .option('--limitations <notes>', 'Limitations')
  .option('--independence <group>', 'Independence group')
  .action(async (opts: SourceOptions) => {
    const source: Source = {
      ...baseFields('source', opts.url),
      url: opts.url,
      source_type: opts.type,
      publisher: opts.publisher ?? null,
      author: opts.author ?? null,
      published_at: opts.published ?? null,
      accessed_at: now(),
      geographic_context: opts.geo ?? null,
      industry_context: opts.industry ?? null,
      employer_context: opts.employer ?? null,
      availability_status: opts.status ?? 'accessible',
      extraction_method: opts.method ?? 'manual',
      reliability_notes: opts.reliability ?? null,
      limitations: opts.limitations ?? null,
      independence_group: opts.independence ?? null
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

    console.log(`Created source: ${source.id}`);
  });

interface EvidenceOptions {
  source: string;
  text: string;
  method: 'direct_quote' | 'paraphrase' | 'inference' | 'statistical_extract' | 'other';
  scope: 'individual_experience' | 'team_pattern' | 'organization_wide' | 'industry_wide' | 'geographic_region';
  level: 'A' | 'B' | 'C' | 'D';
  confidence: number;
  interpretation?: string;
  limitations?: string;
  supporting?: string;
  counter?: string;
  alternatives?: string;
}

program
  .command('evidence:add')
  .description('Add evidence from a source')
  .requiredOption('--source <id>', 'Source ID')
  .requiredOption('--text <text>', 'Observation text')
  .requiredOption('--method <method>', 'Method')
  .requiredOption('--scope <scope>', 'Scope')
  .requiredOption('--level <level>', 'Evidence level')
  .requiredOption('--confidence <n>', 'Confidence (0-1)', (v: string) => { const n = parseFloat(v); if (isNaN(n) || n < 0 || n > 1) throw new Error('Confidence must be 0-1'); return n; })
  .option('--interpretation <text>', 'Interpretation')
  .option('--limitations <text>', 'Limitations')
  .option('--supporting <ids>', 'Supporting evidence IDs (comma-separated)')
  .option('--counter <ids>', 'Counterevidence IDs (comma-separated)')
  .option('--alternatives <ids>', 'Alternative explanation IDs (comma-separated)')
  .action(async (opts: EvidenceOptions) => {
    if (!repo.sources.get.get(opts.source)) { console.error('Source not found'); process.exit(1); }

    const evidence: Evidence = {
      ...baseFields('evidence', opts.text.slice(0, 80)),
      source_id: opts.source,
      observation_text: opts.text,
      interpretation: opts.interpretation ?? null,
      method: opts.method,
      scope: opts.scope,
      evidence_level: opts.level.toUpperCase() as 'A' | 'B' | 'C' | 'D',
      limitations: opts.limitations ?? null,
      confidence: opts.confidence,
      supporting_evidence_ids: opts.supporting ? opts.supporting.split(',').map((s: string) => s.trim()) : [],
      counterevidence_ids: opts.counter ? opts.counter.split(',').map((s: string) => s.trim()) : [],
      alternative_explanation_ids: opts.alternatives ? opts.alternatives.split(',').map((s: string) => s.trim()) : []
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

    console.log(`Created evidence: ${evidence.id}`);
  });

interface ClaimOptions {
  evidence: string;
  text: string;
  type: 'factual_statement' | 'reported_allegation' | 'corroborated_pattern' | 'analytical_interpretation' | 'hypothesis' | 'model_suggestion' | 'owner_approved_conclusion';
  confidence: number;
  geo?: string;
  industry?: string;
  employer?: string;
  uncertainty?: string;
  decision?: 'accepted' | 'rejected' | 'needs_more_evidence' | 'flagged_for_review';
  reason?: string;
}

program
  .command('claim:add')
  .description('Add a claim from evidence')
  .requiredOption('--evidence <ids>', 'Evidence IDs (comma-separated)')
  .requiredOption('--text <text>', 'Claim text')
  .requiredOption('--type <type>', 'Claim type')
  .requiredOption('--confidence <n>', 'Confidence (0-1)', (v: string) => { const n = parseFloat(v); if (isNaN(n) || n < 0 || n > 1) throw new Error('Confidence must be 0-1'); return n; })
  .option('--geo <scope>', 'Geographic scope')
  .option('--industry <scope>', 'Industry scope')
  .option('--employer <scope>', 'Employer scope')
  .option('--uncertainty <notes>', 'Uncertainty notes')
  .option('--decision <decision>', 'Reviewer decision')
  .option('--reason <reason>', 'Review reason')
  .action(async (opts: ClaimOptions) => {
    const eids = opts.evidence.split(',').map((s: string) => s.trim());
    for (const eid of eids) if (!repo.evidence.get.get(eid)) { console.error(`Evidence ${eid} not found`); process.exit(1); }

    const claim: Claim = {
      ...baseFields('claim', opts.text.slice(0, 80)),
      evidence_ids: eids,
      claim_text: opts.text,
      claim_type: opts.type,
      geographic_scope: opts.geo ?? null,
      industry_scope: opts.industry ?? null,
      employer_scope: opts.employer ?? null,
      confidence: opts.confidence,
      uncertainty_notes: opts.uncertainty ?? null,
      reviewer_decision: opts.decision ?? null,
      review_reason: opts.reason ?? null
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

    console.log(`Created claim: ${claim.id}`);
  });

interface AltExpOptions {
  claim: string;
  text: string;
  plausibility: 'high' | 'medium' | 'low' | 'speculative';
  status: 'active' | 'dismissed' | 'needs_investigation';
  supporting?: string;
}

program
  .command('alt:add')
  .description('Add alternative explanation for a claim')
  .requiredOption('--claim <id>', 'Claim ID')
  .requiredOption('--text <text>', 'Explanation text')
  .requiredOption('--plausibility <level>', 'Plausibility')
  .requiredOption('--status <status>', 'Status')
  .option('--supporting <ids>', 'Supporting evidence IDs (comma-separated)')
  .action(async (opts: AltExpOptions) => {
    if (!repo.claims.get.get(opts.claim)) { console.error('Claim not found'); process.exit(1); }
    const eids = opts.supporting ? opts.supporting.split(',').map((s: string) => s.trim()) : [];
    for (const eid of eids) if (!repo.evidence.get.get(eid)) { console.error(`Evidence ${eid} not found`); process.exit(1); }

    const altExp: AlternativeExplanation = {
      ...baseFields('alternative_explanation', opts.text.slice(0, 80)),
      claim_id: opts.claim,
      explanation_text: opts.text,
      plausibility: opts.plausibility,
      supporting_evidence_ids: eids,
      status: opts.status
    };

    repo.alternative_explanations.create.run(
      altExp.id, altExp.schema_version, altExp.type, altExp.revision, altExp.title,
      altExp.created_at, altExp.updated_at, altExp.created_by, altExp.fixture ? 1 : 0,
      altExp.lifecycle, altExp.review ? JSON.stringify(altExp.review) : null,
      altExp.review_due_at, altExp.change_reason,
      altExp.claim_id, altExp.explanation_text, altExp.plausibility,
      JSON.stringify(altExp.supporting_evidence_ids), altExp.status
    );

    console.log(`Created alternative explanation: ${altExp.id}`);
  });

interface TopicOptions {
  claims?: string;
  sources?: string;
  rationale?: string;
  status?: 'active' | 'archived' | 'on_hold';
}

program
  .command('topic:add')
  .description('Create a research topic')
  .option('--claims <ids>', 'Claim IDs (comma-separated)')
  .option('--sources <ids>', 'Source IDs (comma-separated)')
  .option('--rationale <text>', 'Priority rationale')
  .option('--status <status>', 'Status', 'active')
  .action(async (opts: TopicOptions) => {
    const cids = opts.claims ? opts.claims.split(',').map((s: string) => s.trim()) : [];
    const sids = opts.sources ? opts.sources.split(',').map((s: string) => s.trim()) : [];
    for (const cid of cids) if (!repo.claims.get.get(cid)) { console.error(`Claim ${cid} not found`); process.exit(1); }
    for (const sid of sids) if (!repo.sources.get.get(sid)) { console.error(`Source ${sid} not found`); process.exit(1); }

    const topic: Topic = {
      ...baseFields('topic', 'Research Topic'),
      claim_ids: cids,
      source_ids: sids,
      priority_rationale: opts.rationale ?? null,
      status: opts.status ?? 'active'
    };

    repo.topics.create.run(
      topic.id, topic.schema_version, topic.type, topic.revision, topic.title,
      topic.created_at, topic.updated_at, topic.created_by, topic.fixture ? 1 : 0,
      topic.lifecycle, topic.review ? JSON.stringify(topic.review) : null,
      topic.review_due_at, topic.change_reason,
      JSON.stringify(topic.claim_ids), JSON.stringify(topic.source_ids),
      topic.priority_rationale, topic.status
    );

    console.log(`Created topic: ${topic.id}`);
  });

interface BriefOptions {
  topic: string;
  findings: string;
  uncertainties?: string;
  gaps?: string;
  map?: string;
}

program
  .command('brief:add')
  .description('Create a research brief from a topic')
  .requiredOption('--topic <id>', 'Topic ID')
  .requiredOption('--findings <json>', 'Findings JSON array')
  .option('--uncertainties <json>', 'Uncertainties JSON array')
  .option('--gaps <json>', 'Gaps JSON array')
  .option('--map <json>', 'Claim to evidence map JSON object')
  .action(async (opts: BriefOptions) => {
    if (!repo.topics.get.get(opts.topic)) { console.error('Topic not found'); process.exit(1); }

    let findings: Array<{ claim_id: string; summary: string; evidence_level: 'A' | 'B' | 'C' | 'D' }>;
    let uncertainties: string[] = [];
    let gaps: string[] = [];
    let map: Record<string, string[]> = {};

    try {
      findings = JSON.parse(opts.findings);
      uncertainties = JSON.parse(opts.uncertainties || '[]');
      gaps = JSON.parse(opts.gaps || '[]');
      map = JSON.parse(opts.map || '{}');
    } catch (e) { console.error('Invalid JSON'); process.exit(1); }

    for (const f of findings) if (!repo.claims.get.get(f.claim_id)) { console.error(`Claim ${f.claim_id} not found`); process.exit(1); }

    const brief: ResearchBrief = {
      ...baseFields('research_brief', 'Research Brief'),
      topic_id: opts.topic,
      findings,
      uncertainties,
      gaps,
      claim_to_evidence_map: map
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

    console.log(`Created research brief: ${brief.id}`);
  });

program.parse();