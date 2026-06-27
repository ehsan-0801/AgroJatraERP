import { supabase } from './supabase';

const BASE_URL = import.meta.env.VITE_API_URL as string;

/** localStorage key holding the active organization id (sent as x-org-id). */
export const ORG_KEY = 'agrojatra-org';
export const getActiveOrg = () => localStorage.getItem(ORG_KEY);
export const setActiveOrgId = (id: string | null) => {
  if (id) localStorage.setItem(ORG_KEY, id);
  else localStorage.removeItem(ORG_KEY);
};

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const org = getActiveOrg();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(org ? { 'x-org-id': org } : {}),
      ...(options.headers ?? {}),
    },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, payload?.error ?? res.statusText, payload?.details);
  }
  return payload as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export interface Paginated<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  pages: number;
}
