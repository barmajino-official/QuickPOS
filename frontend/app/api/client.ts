/**
 * @file client.ts
 * @description Base API client. Injects JWT from session store and handles 401s.
 */
import { useSessionStore } from '~/store/sessionStore';
import { useUiStore } from '~/store/uiStore';

// Empty base = same-origin relative URLs. The Vite dev server proxies /api and
// /uploads to the backend (see vite.config.ts), so no absolute origin is needed.
export const BASE_URL = '';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = useSessionStore.getState().token;

  const headers = new Headers(options.headers);
  // Let the browser set the multipart boundary for FormData uploads; only force
  // JSON for regular bodies.
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    useSessionStore.getState().clearSession();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    const message = data.message || 'You do not have permission to do that.';
    useUiStore.getState().showToast(message, 'error');
    throw new Error(message);
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || response.statusText || 'API Error');
  }

  return response.json();
}

export const qs = (filters?: Record<string, unknown>) => {
  if (!filters) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  }
  const str = params.toString();
  return str ? `?${str}` : '';
};

export const api = {
  get: (path: string) => fetchWithAuth(path, { method: 'GET' }),
  post: (path: string, body?: unknown) => fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body?: unknown) => fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path: string) => fetchWithAuth(path, { method: 'DELETE' }),
  upload: (path: string, formData: FormData) => fetchWithAuth(path, { method: 'POST', body: formData }),
};
