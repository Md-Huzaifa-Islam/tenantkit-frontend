'use client';

import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, DollarSign, Eye, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { Logo } from '@/components/brand';
import { ThemeToggle } from '@/components/shell/theme-toggle';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage, type AuthResponse } from '@/lib/api';
import { PLANS, type PlanId } from '@/lib/shared';
import type { Paginated } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/utils';

interface Metrics {
  workspaces: { total: number; active: number; suspended: number; byPlan: Record<PlanId, number> };
  mrrCents: number;
  activeUsers7d: number;
  totalUsers: number;
  signups30d: Array<{ date: string; workspaces: number }>;
}

interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  plan: PlanId;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  memberCount: number;
  projectCount: number;
  owner: { name: string; email: string } | null;
}

function Stat({ icon: Icon, label, value, hint }: { icon: typeof Users; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        {label}
        <Icon className="size-4" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function SignupChart({ data }: { data: Metrics['signups30d'] }) {
  const max = Math.max(1, ...data.map((d) => d.workspaces));
  return (
    <div>
      <div className="flex h-28 items-end gap-1" role="img" aria-label={`Workspaces created per day over 30 days, ${data.reduce((n, d) => n + d.workspaces, 0)} total`}>
        {data.map((d) => (
          <div key={d.date} className="group relative flex-1">
            <div className="rounded-sm bg-primary/80 transition-colors group-hover:bg-primary" style={{ height: `${Math.max(4, (d.workspaces / max) * 112)}px`, opacity: d.workspaces ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-foreground px-1.5 py-0.5 text-[10px] text-background group-hover:block">
              {d.date.slice(5)}: {d.workspaces}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{formatDate(data[0]!.date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

function AdminPanel() {
  const { user, startImpersonation } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const metrics = useQuery({ queryKey: ['admin-metrics'], queryFn: () => api<Metrics>('/admin/metrics'), enabled: !!user?.isSuperAdmin });
  const list = useQuery({
    queryKey: ['admin-workspaces', q, page],
    queryFn: () => api<Paginated<AdminWorkspace>>(`/admin/workspaces?page=${page}&pageSize=10${q ? `&q=${encodeURIComponent(q)}` : ''}`),
    enabled: !!user?.isSuperAdmin,
    placeholderData: keepPreviousData,
  });

  if (!user?.isSuperAdmin) {
    return <EmptyState icon={Users} title="Super admins only" description="Sign in as admin@tenantkit.dev to view the platform panel." className="m-8" />;
  }

  async function toggle(w: AdminWorkspace) {
    try {
      await api(`/admin/workspaces/${w.id}/suspend`, { method: 'POST', body: { suspended: w.status === 'ACTIVE' } });
      toast.success(w.status === 'ACTIVE' ? `${w.name} suspended` : `${w.name} restored`);
      queryClient.invalidateQueries({ queryKey: ['admin-workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['admin-metrics'] });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function viewAs(w: AdminWorkspace) {
    try {
      const res = await api<AuthResponse & { workspace: { slug: string; name: string } }>(`/admin/workspaces/${w.id}/impersonate`, { method: 'POST' });
      startImpersonation(res);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  const m = metrics.data;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every workspace on TenantKit. Counts come from a database function that returns aggregates only.</p>
      </div>
      {m ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={Building2} label="Workspaces" value={String(m.workspaces.total)} hint={`${m.workspaces.suspended} suspended`} />
          <Stat icon={DollarSign} label="MRR" value={formatMoney(m.mrrCents)} hint={`${m.workspaces.byPlan.PRO} Pro · ${m.workspaces.byPlan.BUSINESS} Business`} />
          <Stat icon={Users} label="Active users (7 days)" value={String(m.activeUsers7d)} hint={`of ${m.totalUsers} total`} />
          <Stat icon={Building2} label="Free workspaces" value={String(m.workspaces.byPlan.FREE)} hint="Upgrade candidates" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}

      {m && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>New workspaces</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <SignupChart data={m.signups30d} />
          </CardContent>
        </Card>
      )}

      <Card className="mt-6 overflow-hidden">
        <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle>Workspaces</CardTitle>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
            <label htmlFor="ws-search" className="sr-only">
              Search workspaces
            </label>
            <Input id="ws-search" placeholder="Search name or slug" className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-y bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Workspace</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Plan</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Members</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Projects</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Created</th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.data?.items.map((w) => (
                <tr key={w.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {w.name} {w.status === 'SUSPENDED' && <Badge variant="destructive">Suspended</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{w.owner?.email ?? 'No owner'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={w.plan === 'FREE' ? 'outline' : 'default'}>{PLANS[w.plan].name}</Badge>
                  </td>
                  <td className="px-4 py-3">{w.memberCount}</td>
                  <td className="px-4 py-3">{w.projectCount}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDate(w.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => viewAs(w)} disabled={!w.owner}>
                        <Eye aria-hidden /> View as owner
                      </Button>
                      <ConfirmDialog
                        title={w.status === 'ACTIVE' ? `Suspend ${w.name}?` : `Restore ${w.name}?`}
                        description={w.status === 'ACTIVE' ? 'Members will get 403 on every workspace route until restored.' : 'Members regain access immediately.'}
                        confirmLabel={w.status === 'ACTIVE' ? 'Suspend' : 'Restore'}
                        destructive={w.status === 'ACTIVE'}
                        onConfirm={() => toggle(w)}
                        trigger={
                          <Button variant="outline" size="sm">
                            {w.status === 'ACTIVE' ? 'Suspend' : 'Restore'}
                          </Button>
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {list.data && (
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm text-muted-foreground">
            <span>{list.data.total} workspaces</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= list.data.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAuth>
      <div className="min-h-dvh">
        <header className="border-b bg-sidebar">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Logo />
              <Badge variant="warning">Super admin</Badge>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft aria-hidden /> App
                </Link>
              </Button>
            </div>
          </div>
        </header>
        <main id="main">
          <AdminPanel />
        </main>
      </div>
    </RequireAuth>
  );
}
