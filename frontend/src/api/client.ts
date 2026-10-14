const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  
  return res.json();
}

export const api = {
  sources: {
    list: () => request<import('../types').Source[]>('/sources'),
    get: (id: string) => request<import('../types').Source>(`/sources/${id}`),
    create: (data: Partial<import('../types').Source>) => request<import('../types').Source>('/sources', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').Source>) => request<import('../types').Source>(`/sources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/sources/${id}`, { method: 'DELETE' })
  },
  
  evidence: {
    list: () => request<import('../types').Evidence[]>('/evidence'),
    get: (id: string) => request<import('../types').Evidence>(`/evidence/${id}`),
    bySource: (sourceId: string) => request<import('../types').Evidence[]>(`/sources/${sourceId}/evidence`),
    create: (data: Partial<import('../types').Evidence>) => request<import('../types').Evidence>('/evidence', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').Evidence>) => request<import('../types').Evidence>(`/evidence/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/evidence/${id}`, { method: 'DELETE' })
  },
  
  claims: {
    list: () => request<import('../types').Claim[]>('/claims'),
    get: (id: string) => request<import('../types').Claim>(`/claims/${id}`),
    create: (data: Partial<import('../types').Claim>) => request<import('../types').Claim>('/claims', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').Claim>) => request<import('../types').Claim>(`/claims/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/claims/${id}`, { method: 'DELETE' })
  },
  
  alternativeExplanations: {
    list: () => request<import('../types').AlternativeExplanation[]>('/alternative-explanations'),
    get: (id: string) => request<import('../types').AlternativeExplanation>(`/alternative-explanations/${id}`),
    byClaim: (claimId: string) => request<import('../types').AlternativeExplanation[]>(`/claims/${claimId}/alternative-explanations`),
    create: (data: Partial<import('../types').AlternativeExplanation>) => request<import('../types').AlternativeExplanation>('/alternative-explanations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').AlternativeExplanation>) => request<import('../types').AlternativeExplanation>(`/alternative-explanations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/alternative-explanations/${id}`, { method: 'DELETE' })
  },
  
  topics: {
    list: () => request<import('../types').Topic[]>('/topics'),
    get: (id: string) => request<import('../types').Topic>(`/topics/${id}`),
    create: (data: Partial<import('../types').Topic>) => request<import('../types').Topic>('/topics', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').Topic>) => request<import('../types').Topic>(`/topics/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/topics/${id}`, { method: 'DELETE' })
  },
  
  researchBriefs: {
    list: () => request<import('../types').ResearchBrief[]>('/research-briefs'),
    get: (id: string) => request<import('../types').ResearchBrief>(`/research-briefs/${id}`),
    byTopic: (topicId: string) => request<import('../types').ResearchBrief[]>(`/topics/${topicId}/research-briefs`),
    create: (data: Partial<import('../types').ResearchBrief>) => request<import('../types').ResearchBrief>('/research-briefs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').ResearchBrief>) => request<import('../types').ResearchBrief>(`/research-briefs/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/research-briefs/${id}`, { method: 'DELETE' })
  },
  
  linkedinDrafts: {
    list: () => request<import('../types').LinkedInDraft[]>('/linkedin-drafts'),
    get: (id: string) => request<import('../types').LinkedInDraft>(`/linkedin-drafts/${id}`),
    byBrief: (briefId: string) => request<import('../types').LinkedInDraft[]>(`/research-briefs/${briefId}/linkedin-drafts`),
    create: (data: Partial<import('../types').LinkedInDraft>) => request<import('../types').LinkedInDraft>('/linkedin-drafts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').LinkedInDraft>) => request<import('../types').LinkedInDraft>(`/linkedin-drafts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/linkedin-drafts/${id}`, { method: 'DELETE' })
  },
  
  conflicts: {
    list: () => request<import('../types').Conflict[]>('/conflicts'),
    get: (id: string) => request<import('../types').Conflict>(`/conflicts/${id}`),
    create: (data: Partial<import('../types').Conflict>) => request<import('../types').Conflict>('/conflicts', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<import('../types').Conflict>) => request<import('../types').Conflict>(`/conflicts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request<{ success: boolean }>(`/conflicts/${id}`, { method: 'DELETE' })
  }
};