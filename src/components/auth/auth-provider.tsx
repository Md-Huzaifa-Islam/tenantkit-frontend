'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { api, refreshSession, tokens, type AuthResponse, type SessionUser } from '@/lib/api';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface Impersonation {
  workspaceSlug: string;
  workspaceName: string;
}

interface AuthContextValue {
  status: Status;
  user: SessionUser | null;
  impersonation: Impersonation | null;
  /** Store a session returned by login, signup or invite acceptance. */
  setSession(res: AuthResponse): void;
  logout(): Promise<void>;
  refreshUser(): Promise<void>;
  startImpersonation(res: AuthResponse & { workspace: { slug: string; name: string } }): void;
  exitImpersonation(): Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<Status>('loading');
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [impersonation, setImpersonation] = React.useState<Impersonation | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  // On first load, trade the httpOnly refresh cookie for an in-memory access token.
  // The readable `tk_session` hint says whether a session might exist at all.
  React.useEffect(() => {
    let cancelled = false;
    const maybeSignedIn = document.cookie.split('; ').some((c) => c.startsWith('tk_session='));
    (maybeSignedIn ? refreshSession() : Promise.resolve(null)).then((res) => {
      if (cancelled) return;
      setUser(res?.user ?? null);
      setStatus(res ? 'authenticated' : 'unauthenticated');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(
    () =>
      tokens.onExpired(() => {
        setUser(null);
        setImpersonation(null);
        setStatus('unauthenticated');
        queryClient.clear();
      }),
    [queryClient],
  );

  const setSession = React.useCallback(
    (res: AuthResponse) => {
      tokens.set(res.accessToken);
      queryClient.clear();
      setImpersonation(null);
      setUser(res.user);
      setStatus('authenticated');
    },
    [queryClient],
  );

  const logout = React.useCallback(async () => {
    await api('/auth/logout', { method: 'POST', noRefresh: true }).catch(() => undefined);
    tokens.set(null);
    queryClient.clear();
    setUser(null);
    setImpersonation(null);
    setStatus('unauthenticated');
    router.push('/login');
  }, [queryClient, router]);

  const refreshUser = React.useCallback(async () => {
    const me = await api<SessionUser>('/me');
    setUser(me);
  }, []);

  const startImpersonation = React.useCallback(
    (res: AuthResponse & { workspace: { slug: string; name: string } }) => {
      tokens.set(res.accessToken, { readOnly: true });
      queryClient.clear();
      setUser(res.user);
      setImpersonation({ workspaceSlug: res.workspace.slug, workspaceName: res.workspace.name });
      router.push(`/${res.workspace.slug}/projects`);
    },
    [queryClient, router],
  );

  // The admin's own refresh cookie was never touched, so refreshing restores their session.
  const exitImpersonation = React.useCallback(async () => {
    tokens.set(null);
    queryClient.clear();
    setImpersonation(null);
    const res = await refreshSession();
    setUser(res?.user ?? null);
    setStatus(res ? 'authenticated' : 'unauthenticated');
    router.push(res ? '/admin' : '/login');
  }, [queryClient, router]);

  const value = React.useMemo(
    () => ({ status, user, impersonation, setSession, logout, refreshUser, startImpersonation, exitImpersonation }),
    [status, user, impersonation, setSession, logout, refreshUser, startImpersonation, exitImpersonation],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
