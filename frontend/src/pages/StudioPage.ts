import { api } from '../api/client';
import { LinkedInDraft, ResearchBrief, Source, Claim } from '../types';
import { escapeHtml, formatRelativeTime, getRiskFlagClass, getDecisionClass } from '../utils/helpers';
import { Router } from '../components/Router';

let router: Router;
let drafts: LinkedInDraft[] = [];
let briefs: ResearchBrief[] = [];
let sources: Source[] = [];
let claims: Claim[] = [];
let loading = false;

export async function renderStudioPage(appRouter: Router): Promise<void> {
  router = appRouter;
  await loadData();
  render();
}

async function loadData(): Promise<void> {
  loading = true;
  render();
  try {
    const [draftsData, briefsData, sourcesData, claimsData] = await Promise.all([
      api.linkedinDrafts.list(),
      api.researchBriefs.list(),
      api.sources.list(),
      api.claims.list()
    ]);
    drafts = draftsData;
    briefs = briefsData;
    sources = sourcesData;
    claims = claimsData;
  } catch (e) {
    console.error('Failed to load studio:', e);
  } finally {
    loading = false;
    render();
  }
}

function getBriefForDraft(draft: LinkedInDraft): ResearchBrief | undefined {
  return briefs.find(b => b.id === draft.brief_id);
}

function getSourceName(sourceId: string): string {
  const source = sources.find(s => s.id === sourceId);
  return source ? (source.employer_context || source.title || source.url) : sourceId;
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
        <h1>Content Studio</h1>
        <button class="btn btn-primary" id="add-draft-btn">+ New Draft</button>
      </header>
      <main class="app-main">
        ${drafts.length === 0 ? `
          <div class="card empty-state">
            <div class="empty-state-icon">✍️</div>
            <h3 class="empty-state-title">No drafts yet</h3>
            <p>Create LinkedIn drafts from your research briefs.</p>
            <button class="btn btn-primary empty-state-action" id="add-draft-btn-empty">Create Draft</button>
          </div>
        ` : `
          <div class="list" id="drafts-list">
            ${drafts.map(draft => {
              const brief = getBriefForDraft(draft);
              const hasBlockingFlags = draft.risk_flags.some(f => f.severity === 'blocking');
              const hasHighFlags = draft.risk_flags.some(f => f.severity === 'high');
              const flagClass = hasBlockingFlags ? 'risk-flag-blocking' : hasHighFlags ? 'risk-flag-high' : 'risk-flag-medium';
              return `
                <article class="list-item" data-id="${draft.id}">
                  <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(draft.content_text.slice(0, 100))}${draft.content_text.length > 100 ? '…' : ''}</div>
                    <div class="list-item-meta">
                      <span class="badge ${getDecisionClass(draft.owner_decision)}">${draft.owner_decision.replace(/_/g, ' ')}</span>
                      <span class="badge badge-${draft.validation_status}">${draft.validation_status}</span>
                      ${draft.risk_flags.length > 0 ? `<span class="risk-flag ${flagClass}" style="font-size:0.7rem; padding:2px 8px;">${draft.risk_flags.length} flag${draft.risk_flags.length !== 1 ? 's' : ''}</span>` : ''}
                      <span>${brief ? brief.title : 'No brief'}</span>
                    </div>
                    ${draft.risk_flags.length > 0 ? `
                      <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                        ${draft.risk_flags.slice(0, 2).map(f => `<span class="risk-flag ${getRiskFlagClass(f.severity)}" style="font-size:0.7rem; padding:2px 8px;">${f.type.replace(/_/g, ' ')}: ${f.severity}</span>`).join('')}
                        ${draft.risk_flags.length > 2 ? `<span class="risk-flag risk-flag-low" style="font-size:0.7rem; padding:2px 8px;">+${draft.risk_flags.length - 2} more</span>` : ''}
                      </div>
                    ` : ''}
                  </div>
                  <div class="list-item-actions">
                    <button class="btn btn-primary btn-sm edit-draft-btn" data-id="${draft.id}">${draft.owner_decision === 'pending' ? 'Review' : 'View'}</button>
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
  document.querySelectorAll('#add-draft-btn, #add-draft-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => openDraftModal());
  });
  
  document.querySelectorAll('.edit-draft-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) openDraftModal(drafts.find(d => d.id === id));
    });
  });
}

function openDraftModal(draftItem?: LinkedInDraft): void {
  const isEdit = !!draftItem;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  const briefOptions = briefs.map(b => `<option value="${b.id}" ${draftItem?.brief_id === b.id ? 'selected' : ''}>${escapeHtml(b.title)} (${b.findings.length} findings)</option>`).join('');
  
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="max-height:95vh; max-width:100%;">
      <header class="modal-header">
        <h3 class="modal-title" id="modal-title">${isEdit ? 'Edit Draft' : 'New Draft'}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <form id="draft-form" class="modal-body" style="max-height:70vh; overflow-y:auto;">
        <div class="form-group">
          <label class="form-label" for="draft-brief">Research Brief *</label>
          <select id="draft-brief" name="brief_id" class="form-select" required ${isEdit ? 'disabled' : ''}>
            <option value="">Select a research brief…</option>
            ${briefOptions}
          </select>
          ${briefs.length === 0 ? '<p class="form-hint">Create a research brief first in Topic Workspaces.</p>' : ''}
        </div>
        
        <div class="form-group">
          <label class="form-label" for="draft-content">LinkedIn Content *</label>
          <textarea id="draft-content" name="content_text" class="form-textarea" required placeholder="Write your LinkedIn post here. Keep it concise, analytical, and evidence-backed.">${escapeHtml(draftItem?.content_text || '')}</textarea>
          <p class="form-hint">Aim for 150-300 words. Reference specific claims from the brief.</p>
        </div>
        
        <div class="form-group">
          <label class="form-label">Claim-to-Source Mapping *</label>
          <p class="form-hint">Map each key claim in your draft to its supporting source(s).</p>
          <div id="claim-mappings" style="display:flex; flex-direction:column; gap:12px;">
            ${draftItem?.claim_to_source_map.map((mapping, idx) => renderClaimMapping(mapping, idx)).join('') || ''}
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="add-mapping-btn" style="margin-top:8px;">+ Add Claim Mapping</button>
        </div>
        
        ${draftItem && draftItem.risk_flags.length > 0 ? `
          <div class="form-group">
            <label class="form-label">Validation Flags (auto-generated)</label>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${draftItem.risk_flags.map(flag => `
                <div class="risk-flag ${getRiskFlagClass(flag.severity)}">
                  <strong>${flag.type.replace(/_/g, ' ')} (${flag.severity})</strong>
                  <div style="font-size:0.75rem; margin-top:4px;">${escapeHtml(flag.description)}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        ${isEdit ? `
          <div class="form-group">
            <label class="form-label" for="draft-decision">Owner Decision</label>
            <select id="draft-decision" name="owner_decision" class="form-select">
              <option value="pending" ${draftItem?.owner_decision === 'pending' ? 'selected' : ''}>Pending</option>
              <option value="approved" ${draftItem?.owner_decision === 'approved' ? 'selected' : ''}>Approved</option>
              <option value="rejected" ${draftItem?.owner_decision === 'rejected' ? 'selected' : ''}>Rejected</option>
              <option value="needs_revision" ${draftItem?.owner_decision === 'needs_revision' ? 'selected' : ''}>Needs Revision</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="draft-notes">Owner Notes</label>
            <textarea id="draft-notes" name="owner_notes" class="form-textarea" placeholder="Notes for the record…">${escapeHtml(draftItem?.owner_notes || '')}</textarea>
          </div>
        ` : ''}
      </form>
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
        <button type="submit" form="draft-form" class="btn btn-primary">${isEdit ? 'Save' : 'Create'}</button>
      </footer>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  let mappingIndex = draftItem?.claim_to_source_map.length || 0;
  
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  modal.querySelector('#add-mapping-btn')?.addEventListener('click', () => {
    const container = modal.querySelector('#claim-mappings') as HTMLElement;
    container.insertAdjacentHTML('beforeend', renderClaimMapping({
      claim_text: '',
      source_ids: [],
      evidence_level: 'C',
      is_supported: true
    }, mappingIndex++));
  });
  
  modal.querySelector('#draft-brief')?.addEventListener('change', () => {
    // Could auto-populate mappings from brief findings
  });
  
  modal.querySelector('#draft-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const briefId = formData.get('brief_id') as string;
    if (!briefId) {
      alert('Please select a research brief.');
      return;
    }
    
    const brief = briefs.find(b => b.id === briefId);
    if (!brief) {
      alert('Selected brief not found.');
      return;
    }
    
    const mappings: LinkedInDraft['claim_to_source_map'] = [];
    const mappingElements = modal.querySelectorAll('.claim-mapping');
    mappingElements.forEach((el, idx) => {
      const claimText = (el.querySelector('[name="mapping_claim_text"]') as HTMLInputElement)?.value?.trim();
      const sourceIds = Array.from(el.querySelectorAll('[name="mapping_source_ids"]:checked')).map(cb => (cb as HTMLInputElement).value);
      const evidenceLevel = (el.querySelector('[name="mapping_evidence_level"]') as HTMLSelectElement)?.value as 'A' | 'B' | 'C' | 'D';
      const isSupported = (el.querySelector('[name="mapping_is_supported"]') as HTMLInputElement)?.checked ?? true;
      
      if (claimText) {
        mappings.push({ claim_text: claimText, source_ids: sourceIds, evidence_level: evidenceLevel, is_supported: isSupported });
      }
    });
    
    if (mappings.length === 0) {
      alert('Please add at least one claim mapping.');
      return;
    }
    
    const data: Partial<LinkedInDraft> = {
      brief_id: briefId,
      content_text: formData.get('content_text') as string,
      claim_to_source_map: mappings
    };
    
    if (isEdit && draftItem) {
      data.owner_decision = formData.get('owner_decision') as LinkedInDraft['owner_decision'];
      data.owner_notes = formData.get('owner_notes') as string || null;
    }
    
    try {
      if (isEdit && draftItem) {
        await api.linkedinDrafts.update(draftItem.id, data);
      } else {
        await api.linkedinDrafts.create(data);
      }
      closeModal();
      await loadData();
    } catch (err) {
      alert('Failed to save draft: ' + (err as Error).message);
    }
  });
  
  function renderClaimMapping(mapping: { claim_text: string; source_ids: string[]; evidence_level: 'A' | 'B' | 'C' | 'D'; is_supported: boolean }, idx: number): string {
    return `
      <div class="claim-mapping" style="border:1px solid var(--color-border); border-radius:8px; padding:12px; background:var(--color-surface);">
        <div class="form-group" style="margin-bottom:8px;">
          <label class="form-label" style="font-size:0.75rem;">Claim Text *</label>
          <input type="text" name="mapping_claim_text" class="form-input" required value="${escapeHtml(mapping.claim_text)}" placeholder="e.g., Employees report unpaid overtime at Company X">
        </div>
        <div class="form-group" style="margin-bottom:8px;">
          <label class="form-label" style="font-size:0.75rem;">Supporting Sources</label>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${sources.map(s => {
              const checked = mapping.source_ids.includes(s.id) ? 'checked' : '';
              return `
                <label style="display:flex; align-items:center; gap:6px; padding:4px 8px; background:var(--color-bg); border:1px solid var(--color-border); border-radius:6px; cursor:pointer; font-size:0.75rem;">
                  <input type="checkbox" name="mapping_source_ids" value="${s.id}" ${checked} style="width:16px; height:16px;">
                  <span>${escapeHtml(getSourceName(s.id).slice(0, 40))}</span>
                </label>
              `;
            }).join('')}
          </div>
        </div>
        <div style="display:grid; gap:8px; grid-template-columns:1fr 1fr;">
          <div class="form-group" style="margin-bottom:0;">
            <label class="form-label" style="font-size:0.75rem;">Evidence Level</label>
            <select name="mapping_evidence_level" class="form-select" style="font-size:0.8125rem;">
              <option value="A" ${mapping.evidence_level === 'A' ? 'selected' : ''}>A — Strong</option>
              <option value="B" ${mapping.evidence_level === 'B' ? 'selected' : ''}>B — Corroborated</option>
              <option value="C" ${mapping.evidence_level === 'C' ? 'selected' : ''}>C — Individual</option>
              <option value="D" ${mapping.evidence_level === 'D' ? 'selected' : ''}>D — Hypothesis</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0; display:flex; align-items:flex-end;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.8125rem;">
              <input type="checkbox" name="mapping_is_supported" ${mapping.is_supported ? 'checked' : ''} style="width:18px; height:18px;">
              <span>Claim is supported by evidence</span>
            </label>
          </div>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" style="margin-top:8px; font-size:0.75rem;" onclick="this.closest('.claim-mapping').remove()">Remove</button>
      </div>
    `;
  }
}