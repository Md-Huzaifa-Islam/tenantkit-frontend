import { api } from './api';
import type { WorkspaceSummary } from './types';

/** Only allow same-origin relative redirects (no `//evil.com`). */
export function safeNext(next: string | null): string | null {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

/** Where to send a user after signing in: `next`, else their first workspace. */
export async function homePath(next?: string | null): Promise<string> {
  const target = safeNext(next ?? null);
  if (target) return target;
  const workspaces = await api<WorkspaceSummary[]>('/me/workspaces');
  return workspaces[0] ? `/${workspaces[0].slug}/projects` : '/login';
}
