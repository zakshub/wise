import { api } from '../api/client';
import { Source, Evidence } from '../types';
import { formatRelativeTime, escapeHtml, getEvidenceLevelClass } from '../utils/helpers';
import { Router } from '../components/Router';

let router: Router;
let source: Source | null = null;
let evidence: Evidence[] = [];
let loading = false;

export async function renderSourcePage(appRouter: Router, sourceId: string): Promise<void> {
  router = appRouter;
  await loadSource(sourceId);
  render();
}

async function loadSource(id: string): Promise<void> {
  loading = true;
  render();
  try {
    const [sourceData, evidenceData] = await Promise.all([
      api.sources.get(id),
      api.evidence.bySource(id)
    ]);
    source = sourceData;
    evidence = evidenceData;
  } catch (e) {
    console.error('Failed to load source:', e);
    router.navigate('/');
    return;
  } finally {
    loading = false;
    render();
  }
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;
  
  if (loading) {
    app.innerHTML = '<div class="loading"><div class="spinner"></div>Loading…</div>';
    return;
  }
  
  if (!source) {
    app.innerHTML = '<div class="card empty-state">Source not found</div>';
    return;
  }
  
  app.innerHTML = `
    <div class="page">
      <header class="app-header">
        <button class="btn btn-ghost" id="back-btn" aria-label="Back">← Back</button>
        <h1 style="flex:1; text-align:center; font-size:1rem;">${escapeHtml(source.title)}</h1>
        <div style="width:44px;"></div>
      </header>
      <main class="app-main">
        <article class="card">
          <header class="card-header">
            <div>
              <h2 class="card-title">Source Details</h2>
              <p class="card-subtitle">${escapeHtml(source.url)}</p>
            </div>
          </header>
          <div style="display:grid; gap:12px; font-size:0.875rem;">
            <div><strong>Type:</strong> ${source.source_type}</div>
            <div><strong>Availability:</strong> <span class="badge badge-${source.availability_status}">${source.availability_status}</span></div>
            <div><strong>Extraction:</strong> ${source.extraction_method}</div>
            ${source.publisher ? `<div><strong>Publisher:</strong> ${escapeHtml(source.publisher)}</div>` : ''}
            ${source.author ? `<div><strong>Author:</strong> ${escapeHtml(source.author)}</div>` : ''}
            ${source.published_at ? `<div><strong>Published:</strong> ${formatRelativeTime(source.published_at)}</div>` : ''}
            <div><strong>Accessed:</strong> ${formatRelativeTime(source.accessed_at)}</div>
            ${source.geographic_context ? `<div><strong>Geographic:</strong> ${escapeHtml(source.geographic_context)}</div>` : ''}
            ${source.industry_context ? `<div><strong>Industry:</strong> ${escapeHtml(source.industry_context)}</div>` : ''}
            ${source.employer_context ? `<div><strong>Employer:</strong> ${escapeHtml(source.employer_context)}</div>` : ''}
            ${source.independence_group ? `<div><strong>Independence Group:</strong> ${escapeHtml(source.independence_group)}</div>` : ''}
            ${source.reliability_notes ? `<div><strong>Reliability Notes:</strong> ${escapeHtml(source.reliability_notes)}</div>` : ''}
            ${source.limitations ? `<div><strong>Limitations:</strong> ${escapeHtml(source.limitations)}</div>` : ''}
          </div>
        </article>
        
        <section>
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px;">
            <h2 style="font-size:1.125rem; font-weight:600;">Evidence (${evidence.length})</h2>
            <button class="btn btn-primary btn-sm" id="add-evidence-btn">+ Add Evidence</button>
          </div>
          
          ${evidence.length === 0 ? `
            <div class="card empty-state">
              <div class="empty-state-icon">📝</div>
              <h3 class="empty-state-title">No evidence extracted yet</h3>
              <p>Add evidence from this source to build claims.</p>
              <button class="btn btn-primary empty-state-action" id="add-evidence-btn-empty">Add Evidence</button>
            </div>
          ` : `
            <div class="list" id="evidence-list">
              ${evidence.map(e => `
                <article class="list-item" data-id="${e.id}">
                  <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(e.observation_text.slice(0, 120))}${e.observation_text.length > 120 ? '…' : ''}</div>
                    <div class="list-item-meta">
                      <span class="evidence-level ${getEvidenceLevelClass(e.evidence_level)}">Level ${e.evidence_level}</span>
                      <span>${e.scope.replace(/_/g, ' ')}</span>
                      <span>Confidence: ${Math.round(e.confidence * 100)}%</span>
                      ${e.limitations ? `<span>⚠ ${escapeHtml(e.limitations.slice(0, 60))}</span>` : ''}
                    </div>
                    ${e.interpretation ? `<div style="margin-top:8px; font-size:0.8125rem; color:var(--color-text-muted);">${escapeHtml(e.interpretation.slice(0, 100))}${e.interpretation.length > 100 ? '…' : ''}</div>` : ''}
                  </div>
                  <div class="list-item-actions">
                    <button class="btn btn-secondary btn-sm view-evidence-btn" data-id="${e.id}">View</button>
                  </div>
                </article>
              `).join('')}
            </div>
          `}
        </section>
      </main>
    </div>
  `;
  
  attachEvents();
}

function attachEvents(): void {
  document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/'));
  document.querySelectorAll('#add-evidence-btn, #add-evidence-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => openEvidenceModal());
  });
  document.querySelectorAll('.view-evidence-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id && source) router.navigate(`/source/${source.id}/evidence/${id}`);
    });
  });
}

function openEvidenceModal(evidenceItem?: Evidence): void {
  const isEdit = !!evidenceItem;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <h3 class="modal-title" id="modal-title">${isEdit ? 'Edit Evidence' : 'Add Evidence'}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <form id="evidence-form" class="modal-body">
        <input type="hidden" name="source_id" value="${escapeHtml(source?.id || '')}">
        <div class="form-group">
          <label class="form-label" for="evidence-text">Observation Text *</label>
          <textarea id="evidence-text" name="observation_text" class="form-textarea" required placeholder="What did the source say? Use direct quotes where possible.">${escapeHtml(evidenceItem?.observation_text || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="evidence-interpretation">Interpretation</label>
          <textarea id="evidence-interpretation" name="interpretation" class="form-textarea" placeholder="Your interpretation of this observation (optional)">${escapeHtml(evidenceItem?.interpretation || '')}</textarea>
        </div>
        <div style="display:grid; gap:12px; grid-template-columns:1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="evidence-method">Method *</label>
            <select id="evidence-method" name="method" class="form-select" required>
              <option value="direct_quote" ${evidenceItem?.method === 'direct_quote' ? 'selected' : ''}>Direct Quote</option>
              <option value="paraphrase" ${evidenceItem?.method === 'paraphrase' ? 'selected' : ''}>Paraphrase</option>
              <option value="inference" ${evidenceItem?.method === 'inference' ? 'selected' : ''}>Inference</option>
              <option value="statistical_extract" ${evidenceItem?.method === 'statistical_extract' ? 'selected' : ''}>Statistical Extract</option>
              <option value="other" ${evidenceItem?.method === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="evidence-scope">Scope *</label>
            <select id="evidence-scope" name="scope" class="form-select" required>
              <option value="individual_experience" ${evidenceItem?.scope === 'individual_experience' ? 'selected' : ''}>Individual Experience</option>
              <option value="team_pattern" ${evidenceItem?.scope === 'team_pattern' ? 'selected' : ''}>Team Pattern</option>
              <option value="organization_wide" ${evidenceItem?.scope === 'organization_wide' ? 'selected' : ''}>Organization Wide</option>
              <option value="industry_wide" ${evidenceItem?.scope === 'industry_wide' ? 'selected' : ''}>Industry Wide</option>
              <option value="geographic_region" ${evidenceItem?.scope === 'geographic_region' ? 'selected' : ''}>Geographic Region</option>
            </select>
          </div>
        </div>
        <div style="display:grid; gap:12px; grid-template-columns:1fr 1fr;">
          <div class="form-group">
            <label class="form-label" for="evidence-level">Evidence Level *</label>
            <select id="evidence-level" name="evidence_level" class="form-select" required>
              <option value="A" ${evidenceItem?.evidence_level === 'A' ? 'selected' : ''}>A — Strong Evidence</option>
              <option value="B" ${evidenceItem?.evidence_level === 'B' ? 'selected' : ''}>B — Corroborated</option>
              <option value="C" ${evidenceItem?.evidence_level === 'C' ? 'selected' : ''}>C — Individual Report</option>
              <option value="D" ${evidenceItem?.evidence_level === 'D' ? 'selected' : ''}>D — Hypothesis</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label" for="evidence-confidence">Confidence (0-1) *</label>
            <input type="number" id="evidence-confidence" name="confidence" class="form-input" step="0.01" min="0" max="1" required value="${evidenceItem?.confidence ?? 0.5}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="evidence-limitations">Limitations</label>
          <textarea id="evidence-limitations" name="limitations" class="form-textarea" placeholder="Known limitations of this evidence">${escapeHtml(evidenceItem?.limitations || '')}</textarea>
        </div>
      </form>
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
        <button type="submit" form="evidence-form" class="btn btn-primary">${isEdit ? 'Save' : 'Add'}</button>
      </footer>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  modal.querySelector('#evidence-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      source_id: formData.get('source_id') as string,
      observation_text: formData.get('observation_text') as string,
      interpretation: formData.get('interpretation') as string || null,
      method: formData.get('method') as Evidence['method'],
      scope: formData.get('scope') as Evidence['scope'],
      evidence_level: formData.get('evidence_level') as Evidence['evidence_level'],
      confidence: parseFloat(formData.get('confidence') as string),
      limitations: formData.get('limitations') as string || null,
      supporting_evidence_ids: [],
      counterevidence_ids: [],
      alternative_explanation_ids: []
    };
    
    try {
      if (isEdit && evidenceItem) {
        await api.evidence.update(evidenceItem.id, data);
      } else {
        await api.evidence.create(data);
      }
      closeModal();
      await loadSource(source!.id);
    } catch (err) {
      alert('Failed to save evidence: ' + (err as Error).message);
    }
  });
}