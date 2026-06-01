const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

const _getCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 30_000;

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sl_access');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sl_refresh');
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;

  const data = await res.json();
  localStorage.setItem('sl_access', data.access);
  return data.access;
}

const REQUEST_TIMEOUT_MS = 30_000;

function withTimeout(signal?: AbortSignal): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// DRF returns field-level validation errors as { field: ["message", ...] } with no
// top-level `detail`. Flatten those into a readable string so the UI can show the cause
// instead of a generic "Request failed".
function extractErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Request failed';
  const obj = error as Record<string, unknown>;
  if (typeof obj.detail === 'string') return obj.detail;
  const parts: string[] = [];
  for (const [field, value] of Object.entries(obj)) {
    const text = Array.isArray(value) ? value.join(' ') : String(value);
    parts.push(field === 'non_field_errors' ? text : `${field}: ${text}`);
  }
  return parts.length ? parts.join(' · ') : 'Request failed';
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { signal, clear } = withTimeout(options.signal as AbortSignal | undefined);
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal }).finally(clear);

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request<T>(path, options, false);
    }
    // Token refresh failed — clear auth and redirect
    localStorage.removeItem('sl_access');
    localStorage.removeItem('sl_refresh');
    document.cookie = 'sl_authed=; Max-Age=0; path=/';
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(extractErrorMessage(error)), { status: res.status, data: error });
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return unwrapPaginated(await res.json()) as T;
}

// Auto-unwrap DRF paginated responses ({ count, next, previous, results: [...] })
// so callers that expect a plain array keep working regardless of the backend's
// pagination setting.
function unwrapPaginated(data: unknown): unknown {
  if (
    data && typeof data === 'object' && !Array.isArray(data) &&
    Array.isArray((data as { results?: unknown }).results) &&
    'count' in data && 'next' in data && 'previous' in data
  ) {
    return (data as unknown as { results: unknown[] }).results;
  }
  return data;
}

async function requestForm<T>(path: string, formData: FormData, retry = true): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const { signal, clear } = withTimeout();
  const res = await fetch(`${API_BASE}${path}`, { method: 'POST', headers, body: formData, signal }).finally(clear);

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken();
    if (newToken) return requestForm<T>(path, formData, false);
    localStorage.removeItem('sl_access');
    localStorage.removeItem('sl_refresh');
    document.cookie = 'sl_authed=; Max-Age=0; path=/';
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw Object.assign(new Error(extractErrorMessage(error)), { status: res.status, data: error });
  }

  if (res.status === 204) return undefined as T;
  return unwrapPaginated(await res.json()) as T;
}

async function cachedGet<T>(path: string, noCache = false): Promise<T> {
  const hit = _getCache.get(path);
  if (!noCache && hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T;
  const data = await request<T>(path);
  _getCache.set(path, { data, ts: Date.now() });
  return data;
}

export const apiClient = {
  get: <T>(path: string, noCache = false) => cachedGet<T>(path, noCache),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
