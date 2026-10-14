import { api } from '../api/client';
import { Topic, Claim, Source } from '../types';
import { escapeHtml, formatRelativeTime } from '../utils/helpers';
import { Router } from '../components/Router';

let router: Router;
let topics: Topic[] = [];
let claims: Claim[] = [];
let sources: Source[] = [];
let loading = false;

export async function renderTopicsPage(appRouter: Router): Promise<void> {
  router = appRouter;
  await loadData();
  render();
}

async function loadData(): Promise<void> {
  loading = true;
  render();
  try {
    const [topicsData, claimsData, sourcesData] = await Promise.all([
      api.topics.list(),
      api.claims.list(),
      api.sources.list()
    ]);
    topics = topicsData;
    claims = claimsData;
    sources = sourcesData;
  } catch (e) {
    console.error('Failed to load topics:', e);
  } finally {
    loading = false;
    render();
  }
}

function getClaimsForTopic(topic: Topic): Claim[] {
  return claims.filter(c => topic.claim_ids.includes(c.id));
}

function getSourcesForTopic(topic: Topic): Source[] {
  return sources.filter(s => topic.source_ids.includes(s.id));
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
        <h1>Topic Workspaces</h1>
        <button class="btn btn-primary" id="add-topic-btn">+ New Topic</button>
      </header>
      <main class="app-main">
        ${topics.length === 0 ? `
          <div class="card empty-state">
            <div class="empty-state-icon">📂</div>
            <h3 class="empty-state-title">No topics yet</h3>
            <p>Group related claims into research topics.</p>
            <button class="btn btn-primary empty-state-action" id="add-topic-btn-empty">Create Topic</button>
          </div>
        ` : `
          <div class="list" id="topics-list">
            ${topics.map(topic => {
              const topicClaims = getClaimsForTopic(topic);
              const topicSources = getSourcesForTopic(topic);
              return `
                <article class="list-item" data-id="${topic.id}">
                  <div class="list-item-content">
                    <div class="list-item-title">${escapeHtml(topic.title)}</div>
                    <div class="list-item-meta">
                      <span class="badge badge-${topic.status}">${topic.status}</span>
                      <span>${topicClaims.length} claims</span>
                      <span>${topicSources.length} sources</span>
                      ${topic.priority_rationale ? `<span style="max-width:200px;">${escapeHtml(topic.priority_rationale.slice(0, 80))}${topic.priority_rationale.length > 80 ? '…' : ''}</span>` : ''}
                    </div>
                    ${topicClaims.length > 0 ? `
                      <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
                        ${topicClaims.slice(0, 3).map(c => `<span style="font-size:0.75rem; color:var(--color-text-muted); background:var(--color-bg); padding:2px 8px; border-radius:6px;">${escapeHtml(c.claim_text.slice(0, 40))}…</span>`).join('')}
                        ${topicClaims.length > 3 ? `<span style="font-size:0.75rem; color:var(--color-text-muted);">+${topicClaims.length - 3} more</span>` : ''}
                      </div>
                    ` : ''}
                  </div>
                  <div class="list-item-actions">
                    <button class="btn btn-primary btn-sm view-topic-btn" data-id="${topic.id}">Open</button>
                    <button class="btn btn-secondary btn-sm edit-topic-btn" data-id="${topic.id}">Edit</button>
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
  document.querySelectorAll('#add-topic-btn, #add-topic-btn-empty').forEach(btn => {
    btn.addEventListener('click', () => openTopicModal());
  });
  
  document.querySelectorAll('.view-topic-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) router.navigate(`/topic/${id}`);
    });
  });
  
  document.querySelectorAll('.edit-topic-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) openTopicModal(topics.find(t => t.id === id));
    });
  });
}

function openTopicModal(topicItem?: Topic): void {
  const isEdit = !!topicItem;
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" style="max-height:95vh;">
      <header class="modal-header">
        <h3 class="modal-title" id="modal-title">${isEdit ? 'Edit Topic' : 'Create Topic'}</h3>
        <button class="modal-close" aria-label="Close">&times;</button>
      </header>
      <form id="topic-form" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="topic-title">Title *</label>
          <input type="text" id="topic-title" name="title" class="form-input" required placeholder="e.g., Unpaid Overtime in Karachi Tech" value="${escapeHtml(topicItem?.title || '')}">
        </div>
        <div class="form-group">
          <label class="form-label">Claims</label>
          <div style="display:flex; flex-wrap:wrap; gap:8px; max-height:200px; overflow-y:auto;">
            ${claims.map(c => `
              <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; cursor:pointer; font-size:0.8125rem;">
                <input type="checkbox" name="claim_ids" value="${c.id}" ${topicItem?.claim_ids.includes(c.id) ? 'checked' : ''} style="width:18px; height:18px;">
                <span>${escapeHtml(c.claim_text.slice(0, 80))}${c.claim_text.length > 80 ? '…' : ''}</span>
              </label>
            `).join('')}
            ${claims.length === 0 ? '<p class="form-hint" style="margin:0;">No claims available. Create claims first.</p>' : ''}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Sources</label>
          <div style="display:flex; flex-wrap:wrap; gap:8px; max-height:150px; overflow-y:auto;">
            ${sources.map(s => `
              <label style="display:flex; align-items:center; gap:8px; padding:8px 12px; background:var(--color-surface); border:1px solid var(--color-border); border-radius:8px; cursor:pointer; font-size:0.8125rem;">
                <input type="checkbox" name="source_ids" value="${s.id}" ${topicItem?.source_ids.includes(s.id) ? 'checked' : ''} style="width:18px; height:18px;">
                <span>${escapeHtml(s.title || s.url).slice(0, 60)}</span>
              </label>
            `).join('')}
            ${sources.length === 0 ? '<p class="form-hint" style="margin:0;">No sources available.</p>' : ''}
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="topic-rationale">Priority Rationale</label>
          <textarea id="topic-rationale" name="priority_rationale" class="form-textarea" placeholder="Why is this topic a priority? Recurrence, legal implications, public interest…">${escapeHtml(topicItem?.priority_rationale || '')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label" for="topic-status">Status</label>
          <select id="topic-status" name="status" class="form-select">
            <option value="active" ${topicItem?.status === 'active' ? 'selected' : ''}>Active</option>
            <option value="on_hold" ${topicItem?.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
            <option value="archived" ${topicItem?.status === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>
      </form>
      <footer class="modal-footer">
        <button type="button" class="btn btn-secondary modal-close-btn">Cancel</button>
        <button type="submit" form="topic-form" class="btn btn-primary">${isEdit ? 'Save' : 'Create'}</button>
      </footer>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const closeModal = () => modal.remove();
  modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('.modal-close-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  
  modal.querySelector('#topic-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    const claimIds = formData.getAll('claim_ids') as string[];
    const sourceIds = formData.getAll('source_ids') as string[];
    
    const data = {
      claim_ids: claimIds,
      source_ids: sourceIds,
      priority_rationale: formData.get('priority_rationale') as string || null,
      status: formData.get('status') as Topic['status'] || 'active'
    };
    
    try {
      if (isEdit && topicItem) {
        await api.topics.update(topicItem.id, data);
      } else {
        await api.topics.create(data);
      }
      closeModal();
      await loadData();
    } catch (err) {
      alert('Failed to save topic: ' + (err as Error).message);
    }
  });
}