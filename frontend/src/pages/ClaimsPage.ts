import { api } from '../api/client';
import { Claim, Evidence, Source } from '../types';
import { formatRelativeTime, escapeHtml, getEvidenceLevelClass, getDecisionClass } from '../utils/helpers';
import { Router } from '../components/Router';

let router: Router;
let claims: Claim[] = [];
let evidence: Evidence[] = [];
let sources: Source[] = [];
let loading = false;

export async function renderClaimsPage(appRouter: Router): Promise<void> {
  router = appRouter;
  await loadData();
  render();
}

async function loadData(): Promise<void> {
  loading = true;
  render();
  try {
    const [claimsData, evidenceData, sourcesData] = await Promise.all([
      api.claims.list(),
      api.evidence.list(),
      api.sources.list()
    ]);
    claims = claimsData;
    evidence = evidenceData;
    sources = sourcesData;
  } catch (e) {
    console.error('Failed to load claims:', e);
  } finally {
    loading = false;
    render();
  }
}

function getEvidenceForClaim(claim: Claim): Evidence[] {
  return evidence.filter(e => claim.evidence_ids.includes(e.id));
}

function getSourceForEvidence(evidenceItem: Evidence): Source | undefined {
  return sources.find(s => s.id === evidenceItem.source_id);
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;
  
  if (loading) {
    app.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
    return;
  }
  
  app.innerHTML = `
    <div class="page">
      <header class="app-header">
        <h1>Claim Review</h1>
        <button class="btn btn-primary" id="add-claim-btn">+ Add Claim</button>
      </header>
      <main class="app-main">
        ${claims.length === 0 ? `
          <div class="card empty-state">
            <div class="empty-state-icon">⚖️</div>
            <h3 class="empty-state-title">No claims yet</h3>
            <p>Create claims from your evidence to build research topics.</p>
            <button class="btn btn-primary empty-state-action" id="add-claim-btn-empty">Add Claim</button>
          </div>
        ` : `
          <div class="list" id="claims-list">
            ${claims.map(claim => {
              const claimEvidence = getEvidenceForClaim(claim);
              const maxLevel = claimEvidence.reduce((max, e) => {
                const order = { A: 4, B: 3, C: 2, D: 1 };
                return order[e.evidence_level] > order[max] ? e.evidence_level : max;
              }, 'D' as 'A' | 'B' | 'C' | 'D');
              
              return `
                <article class="list-item" data-id="${claim.id}">
                  <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(claim.claim_text)}</div>
                    <div class="list-item-meta">
                      <span class="badge badge-${claim.claim_type.replace(/_/g, '-')}">${claim.claim_type.replace(/_/g, ' ')}</span>
                      <span class="evidence-level ${getEvidenceLevelClass(maxLevel)}">Best: Level ${maxLevel}</span>
                      <span>${claimEvidence.length} evidence</span>
                      <span>Confidence: ${Math.round(claim.confidence * 100)}%</span>
                      ${claim.reviewer_decision ? `<span class="badge ${getDecisionClass(claim.reviewer_decision)}">${claim.reviewer_decision.replace(/_/g, ' ')}</span>` : ''}
                      ${claim.employer_scope ? `<span>🏢 ${escapeHtml(claim.employer_scope)}</span>` : ''}
                    </div>
                    ${claim.uncertainty_notes ? `<div style="margin-top:8px; font-size:0.8125rem; color:var(--color-text-muted);">Uncertainty: ${escapeHtml(claim.uncertainty_notes.slice(0, 100))}${claim.uncertainty_notes.length > 100 ? '…' : ''}</div>` : ''}
                  </div>
                  <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm view-claim-btn" data-id="${claim.id}">View</button>
                    <button class="btn btn-primary btn-sm edit-claim-btn" data-id="${claim.id}">Edit</button>
                  </div>
                </article>
              `;
            }).join('')}
          </div>
        `}
      </main>
    </div>
  `;
  
  attachEvents();
}

function attachEvents(): void {
  document.querySelectorAll('#add-claim-btn, #add-claim-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => openClaimModal());
  });
  
  document.querySelectorAll('.view-claim-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) router.navigate(`/claim/${id}`);
    });
  });
  
  document.querySelectorAll('.edit-claim-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) openClaimModal(claims.find(c => c.id === id));
    });
  });
}

function openClaimModal(claimItem?: Claim): void {
  const isEdit = !!claimItem;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="max-height:95vh;">
      <header class="modal-header">
        <h3 class="modal-title" id="modal-title">${isEdit ? 'Edit Claim' : 'Add Claim'}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <form id="claim-form" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="claim-text">Claim Text *</label>
          <textarea id="claim-text" name="claim_text" class="form-textarea" required placeholder="State the claim clearly and precisely.">${escapeHtml(claimItem?.claim_text || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="claim-evidence">Supporting Evidence *</label>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
            ${evidence.map(e => {
              const source = getSourceForEvidence(e);
              const checked = claimItem?.evidence_ids.includes(e.id) ? 'checked' : '';
              return `
                <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; cursor:pointer; font-size:0.8125rem;">
                  <input type="checkbox" name="evidence_ids" value="${e.id}" ${checked} style="width:18px; height:18px;">
                  <span><strong class="${getEvidenceLevelClass(e.evidence_level)}">[${e.evidence_level}]</strong> ${escapeHtml(e.observation_text.slice(0, 60))}…</span>
                  ${source ? `<span style="color:var(--color-text-muted); font-size:0.75rem;">${escapeHtml(source.employer_context || source.title)}</span>` : ''}
                </label>
              `;
            }).join('')}
          </div>
          <p class="form-hint">Select one or more evidence items that support this claim.</p>
        </div>
        <div style="display:grid; gap:12px; grid-template-columns:1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="claim-type">Claim Type *</label>
            <select id="claim-type" name="claim_type" class="form-select" required>
              <option value="factual_statement" ${claimItem?.claim_type === 'factual_statement' ? 'selected' : ''}>Factual Statement</option>
              <option value="reported_allegation" ${claimItem?.claim_type === 'reported_allegation' ? 'selected' : ''}>Reported Allegation</option>
              <option value="corroborated_pattern" ${claimItem?.claim_type === 'corroborated_pattern' ? 'selected' : ''}>Corroborated Pattern</option>
              <option value="analytical_interpretation" ${claimItem?.claim_type === 'analytical_interpretation' ? 'selected' : ''}>Analytical Interpretation</option>
              <option value="hypothesis" ${claimItem?.claim_type === 'hypothesis' ? 'selected' : ''}>Hypothesis</option>
              <option value="model_suggestion" ${claimItem?.claim_type === 'model_suggestion' ? 'selected' : ''}>Model Suggestion</option>
              <option value="owner_approved_conclusion" ${claimItem?.claim_type === 'owner_approved_conclusion' ? 'selected' : ''}>Owner Approved Conclusion</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="claim-confidence">Confidence (0-1) *</label>
            <input type="number" id="claim-confidence" name="confidence" class="form-input" step="0.01" min="0" max="1" required value="${claimItem?.confidence ?? 0.5}">
          </div>
        </div>
        <div style="display:grid; gap:12px; grid-template-columns:1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="claim-geo">Geographic Scope</label>
            <input type="text" id="claim-geo" name="geographic_scope" class="form-input" placeholder="e.g., Karachi, Pakistan" value="${escapeHtml(claimItem?.geographic_scope || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="claim-industry">Industry Scope</label>
            <input type="text" id="claim-industry" name="industry_scope" class="form-input" placeholder="e.g., Technology" value="${escapeHtml(claimItem?.industry_scope || '')}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="claim-employer">Employer Scope</label>
          <input type="text" id="claim-employer" name="employer_scope" class="form-input" placeholder="e.g., Company Name (if named)" value="${escapeHtml(claimItem?.employer_scope || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="claim-uncertainty">Uncertainty Notes</label>
          <textarea id="claim-uncertainty" name="uncertainty_notes" class="form-textarea" placeholder="What is uncertain, missing, or needs more evidence?">${escapeHtml(claimItem?.uncertainty_notes || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="claim-decision">Reviewer Decision</label>
          <select id="claim-decision" name="reviewer_decision" class="form-select">
            <option value="">— Not reviewed —</option>
            <option value="accepted" ${claimItem?.reviewer_decision === 'accepted' ? 'selected' : ''}>Accepted</option>
            <option value="rejected" ${claimItem?.reviewer_decision === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="needs_more_evidence" ${claimItem?.reviewer_decision === 'needs_more_evidence' ? 'selected' : ''}>Needs More Evidence</option>
            <option value="flagged_for_review" ${claimItem?.reviewer_decision === 'flagged_for_review' ? 'selected' : ''}>Flagged for Review</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="claim-review-reason">Review Reason</label>
          <textarea id="claim-review-reason" name="review_reason" class="form-textarea" placeholder="Why this decision?">${escapeHtml(claimItem?.review_reason || '')}</textarea>
        </div>
      </form>
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
        <button type="submit" form="claim-form" class="btn btn-primary">${isEdit ? 'Save' : 'Add'}</button>
      </footer>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  modal.querySelector('#claim-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const evidenceIds = formData.getAll('evidence_ids') as string[];
    if (evidenceIds.length === 0) {
      alert('Please select at least one evidence item.');
      return;
    }
    
    const data = {
      evidence_ids: evidenceIds,
      claim_text: formData.get('claim_text') as string,
      claim_type: formData.get('claim_type') as Claim['claim_type'],
      confidence: parseFloat(formData.get('confidence') as string),
      geographic_scope: formData.get('geographic_scope') as string || null,
      industry_scope: formData.get('industry_scope') as string || null,
      employer_scope: formData.get('employer_scope') as string || null,
      uncertainty_notes: formData.get('uncertainty_notes') as string || null,
      reviewer_decision: formData.get('reviewer_decision') as Claim['reviewer_decision'] || null,
      review_reason: formData.get('review_reason') as string || null
    };
    
    try {
      if (isEdit && claimItem) {
        await api.claims.update(claimItem.id, data);
      } else {
        await api.claims.create(data);
      }
      closeModal();
      await loadData();
    } catch (err) {
      alert('Failed to save claim: ' + (err as Error).message);
    }
  });
}