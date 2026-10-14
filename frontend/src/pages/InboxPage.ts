import { api } from '../api/client';
import { Source } from '../types';
import { formatRelativeTime, escapeHtml, getEvidenceLevelClass } from '../utils/helpers';
import { Router } from '../components/Router';

let router: Router;
let sources: Source[] = [];
let loading = false;

export async function renderInboxPage(appRouter: Router): Promise<void> {
  router = appRouter;
  await loadSources();
  render();
}

async function loadSources(): Promise<void> {
  loading = true;
  render();
  try {
    sources = await api.sources.list();
  } catch (e) {
    console.error('Failed to load sources:', e);
  } finally {
    loading = false;
    render();
  }
}

function render(): void {
  const app = document.getElementById('app');
  if (!app) return;
  
  app.innerHTML = `
    <div class="page">
      <header class="app-header">
        <h1>Research Inbox</h1>
        <button class="btn btn-primary" id="add-source-btn">+ Add Source</button>
      </header>
      <main class="app-main">
        ${loading ? '<div class="loading"><div class="spinner"></div>Loading sources…</div>' : ''}
        ${sources.length === 0 && !loading ? `
          <div class="card empty-state">
            <div class="empty-state-icon">📥</div>
            <h3 class="empty-state-title">No sources yet</h3>
            <p>Add your first source URL to start building your research workspace.</p>
            <button class="btn btn-primary empty-state-action" id="add-source-btn-empty">Add Source</button>
          </div>
        ` : ''}
        ${sources.length > 0 ? `
          <div class="list" id="sources-list">
            ${sources.map(source => `
              <article class="list-item" data-id="${source.id}">
                <div class="list-item-content">
                  <div class="list-item-title">${escapeHtml(source.title || source.url)}</div>
                  <div class="list-item-meta">
                    <span class="badge badge-${source.availability_status}">${source.availability_status}</span>
                    <span>${source.source_type}</span>
                    ${source.geographic_context ? `<span>📍 ${escapeHtml(source.geographic_context)}</span>` : ''}
                    ${source.industry_context ? `<span>🏭 ${escapeHtml(source.industry_context)}</span>` : ''}
                    ${source.employer_context ? `<span>🏢 ${escapeHtml(source.employer_context)}</span>` : ''}
                    <span>${formatRelativeTime(source.created_at)}</span>
                  </div>
                </div>
                <div class="list-item-actions">
                  <button class="btn btn-secondary btn-sm view-source-btn" data-id="${source.id}">View</button>
                </div>
              </article>
            `).join('')}
          </div>
        ` : ''}
      </main>
      <footer class="app-footer">Wise — Pakistan Workplace Research Intelligence</footer>
    </div>
  `;
  
  attachEvents();
}

function attachEvents(): void {
  document.querySelectorAll('#add-source-btn, #add-source-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => openSourceModal());
  });
  
  document.querySelectorAll('.view-source-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) router.navigate(`/source/${id}`);
    });
  });
}

function openSourceModal(source?: Source): void {
  const isEdit = !!source;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <header class="modal-header">
        <h3 class="modal-title" id="modal-title">${isEdit ? 'Edit Source' : 'Add Source'}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <form id="source-form" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="source-url">URL *</label>
          <input type="url" id="source-url" class="form-input" required value="${escapeHtml(source?.url || '')}" ${isEdit ? 'readonly' : ''}>
        </div>
        <div class="form-group">
          <label class="form-label" for="source-type">Source Type *</label>
          <select id="source-type" class="form-select" required ${isEdit ? 'disabled' : ''}>
            <option value="review_platform" ${source?.source_type === 'review_platform' ? 'selected' : ''}>Review Platform</option>
            <option value="news" ${source?.source_type === 'news' ? 'selected' : ''}>News</option>
            <option value="government" ${source?.source_type === 'government' ? 'selected' : ''}>Government</option>
            <option value="academic" ${source?.source_type === 'academic' ? 'selected' : ''}>Academic</option>
            <option value="company_statement" ${source?.source_type === 'company_statement' ? 'selected' : ''}>Company Statement</option>
            <option value="forum" ${source?.source_type === 'forum' ? 'selected' : ''}>Forum</option>
            <option value="social_media" ${source?.source_type === 'social_media' ? 'selected' : ''}>Social Media</option>
            <option value="other" ${source?.source_type === 'other' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="source-availability">Availability Status</label>
          <select id="source-availability" class="form-select">
            <option value="accessible" ${source?.availability_status === 'accessible' ? 'selected' : ''}>Accessible</option>
            <option value="paywall" ${source?.availability_status === 'paywall' ? 'selected' : ''}>Paywall</option>
            <option value="login_required" ${source?.availability_status === 'login_required' ? 'selected' : ''}>Login Required</option>
            <option value="rate_limited" ${source?.availability_status === 'rate_limited' ? 'selected' : ''}>Rate Limited</option>
            <option value="blocked" ${source?.availability_status === 'blocked' ? 'selected' : ''}>Blocked</option>
            <option value="removed" ${source?.availability_status === 'removed' ? 'selected' : ''}>Removed</option>
            <option value="unknown" ${source?.availability_status === 'unknown' ? 'selected' : ''}>Unknown</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="source-geo">Geographic Context</label>
          <input type="text" id="source-geo" class="form-input" placeholder="e.g., Karachi, Pakistan" value="${escapeHtml(source?.geographic_context || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="source-industry">Industry Context</label>
          <input type="text" id="source-industry" class="form-input" placeholder="e.g., Technology, Banking" value="${escapeHtml(source?.industry_context || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="source-employer">Employer Context</label>
          <input type="text" id="source-employer" class="form-input" placeholder="e.g., Company Name" value="${escapeHtml(source?.employer_context || '')}">
        </div>
        <div class="form-group">
          <label class="form-label" for="source-limitations">Limitations</label>
          <textarea id="source-limitations" class="form-textarea" placeholder="Known limitations, missing context, access issues…">${escapeHtml(source?.limitations || '')}</textarea>
        </div>
      </form>
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
        <button type="submit" form="source-form" class="btn btn-primary">${isEdit ? 'Save' : 'Add'}</button>
      </footer>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  modal.querySelector('#source-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const data = {
      url: formData.get('source-url') as string,
      source_type: formData.get('source-type') as Source['source_type'],
      availability_status: formData.get('source-availability') as Source['availability_status'],
      geographic_context: formData.get('source-geo') as string || null,
      industry_context: formData.get('source-industry') as string || null,
      employer_context: formData.get('source-employer') as string || null,
      limitations: formData.get('source-limitations') as string || null,
      extraction_method: 'manual' as const,
      publisher: null,
      author: null,
      published_at: null,
      independence_group: null,
      reliability_notes: null
    };
    
    try {
      if (isEdit && source) {
        await api.sources.update(source.id, data);
      } else {
        await api.sources.create(data);
      }
      closeModal();
      await loadSources();
    } catch (err) {
      alert('Failed to save source: ' + (err as Error).message);
    }
  });
}