import type { ApiErrorBody } from './shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Field-level messages from a VALIDATION_FAILED response, keyed by path. */
  get fieldErrors(): Record<string, string> {
    const issues = (this.details as { issues?: Array<{ path: string; message: string }> } | undefined)?.issues ?? [];
    return Object.fromEntries(issues.map((i) => [i.path, i.message]));
  }
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
  isSuperAdmin: boolean;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: number;
  user: SessionUser;
  workspaceSlug?: string;
}

// ---------- in-memory token store (never persisted to localStorage) ----------
type Listener = () => void;
let accessToken: string | null = null;
let readOnly = false;
const expiredListeners = new Set<Listener>();

export const tokens = {
  get: () => accessToken,
  set(token: string | null, opts: { readOnly?: boolean } = {}) {
    accessToken = token;
    readOnly = opts.readOnly ?? false;
  },
  isReadOnly: () => readOnly,
  onExpired(fn: Listener): () => void {
    expiredListeners.add(fn);
    return () => {
      expiredListeners.delete(fn);
    };
  },
};

// ---------- refresh (single flight) ----------
let inFlight: Promise<AuthResponse | null> | null = null;

/**
 * Exchanges the httpOnly refresh cookie for a new access token. Concurrent callers
 * share one request: the backend treats a second use of the same refresh token as
 * theft and revokes the session.
 */
export function refreshSession(): Promise<AuthResponse | null> {
  inFlight ??= (async () => {
    try {
      const res = await fetch('/api/v1/auth/refresh', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) return null;
      const data = (await res.json()) as AuthResponse;
      tokens.set(data.accessToken);
      return data;
    } catch {
      return null;
    } finally {
      setTimeout(() => (inFlight = null), 0);
    }
  })();
  return inFlight;
}

// ---------- request helper ----------
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  formData?: FormData;
  workspaceId?: string;
  signal?: AbortSignal;
  /** Don't attempt a token refresh on 401 (used by auth endpoints). */
  noRefresh?: boolean;
}

async function send(path: string, opts: RequestOptions): Promise<Response> {
  const headers: Record<string, string> = {};
  const token = tokens.get();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (opts.workspaceId) headers['X-Workspace-Id'] = opts.workspaceId;
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(`/api/v1${path}`, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.formData ?? (opts.body !== undefined ? JSON.stringify(opts.body) : undefined),
    credentials: 'same-origin',
    signal: opts.signal,
  });
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  let res = await send(path, opts);

  if (res.status === 401 && !opts.noRefresh && tokens.get()) {
    // Impersonation tokens can't be refreshed; an expired one ends the session.
    const refreshed = tokens.isReadOnly() ? null : await refreshSession();
    if (refreshed) {
      res = await send(path, opts);
    } else {
      tokens.set(null);
      expiredListeners.forEach((fn) => fn());
    }
  }

  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;
  if (!res.ok) {
    const err = (data as ApiErrorBody | undefined)?.error;
    throw new ApiError(res.status, err?.code ?? `HTTP_${res.status}`, err?.message ?? res.statusText, err?.details);
  }
  return data as T;
}

export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
