'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ScrollText } from 'lucide-react';
import { useState } from 'react';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, NativeSelect } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { keys, useMembers } from '@/lib/queries';
import { AUDIT_ACTIONS } from '@/lib/shared';
import type { AuditEntry, Paginated } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';

const GROUPS = ['workspace', 'member', 'billing', 'project'] as const;

function describe(e: AuditEntry): string {
  const m = e.metadata as Record<string, unknown>;
  const fromTo = (x: unknown) => {
    const change = x as { from?: unknown; to?: unknown } | null;
    return change && typeof change === 'object' && 'from' in change ? `${change.from} → ${change.to}` : '';
  };
  switch (e.action) {
    case 'member.role_changed':
    case 'billing.plan_changed':
      return `${m.from} → ${m.to}`;
    case 'member.invited':
    case 'member.invite_resent':
    case 'member.invite_revoked':
    case 'member.joined':
    case 'member.removed':
      return String(m.email ?? '');
    case 'workspace.updated':
      return Object.entries(m).map(([k, v]) => `${k}: ${fromTo(v)}`).join(', ');
    case 'project.created':
    case 'project.deleted':
      return String(m.name ?? '');
    case 'workspace.impersonated':
      return `Support viewed as ${m.viewedAs} (read only)`;
    default:
      return '';
  }
}

const variant = (action: string) =>
  action.startsWith('billing') ? 'success' : action.startsWith('member') ? 'default' : action.includes('suspend') || action.includes('impersonat') ? 'warning' : 'secondary';

export default function AuditLogPage() {
  const { workspace } = useWorkspace();
  const members = useMembers(workspace.id);
  const [filters, setFilters] = useState({ action: '', actor: '', from: '', to: '' });
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), pageSize: '20' });
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  const qs = params.toString();

  const logs = useQuery({
    queryKey: keys.audit(workspace.id, qs),
    queryFn: () => api<Paginated<AuditEntry>>(`/audit-logs?${qs}`, { workspaceId: workspace.id }),
    placeholderData: keepPreviousData,
  });

  const update = (k: keyof typeof filters, v: string) => {
    setFilters((f) => ({ ...f, [k]: v }));
    setPage(1);
  };

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="f-action">Action</Label>
          <NativeSelect id="f-action" value={filters.action} onChange={(e) => update('action', e.target.value)}>
            <option value="">All actions</option>
            {GROUPS.map((g) => (
              <optgroup key={g} label={g[0]!.toUpperCase() + g.slice(1)}>
                <option value={`${g}.*`}>All {g} events</option>
                {AUDIT_ACTIONS.filter((a) => a.startsWith(`${g}.`)).map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </optgroup>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-actor">Actor</Label>
          <NativeSelect id="f-actor" value={filters.actor} onChange={(e) => update('actor', e.target.value)}>
            <option value="">Anyone</option>
            {members.data?.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-from">From</Label>
          <Input id="f-from" type="date" value={filters.from} onChange={(e) => update('from', e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-to">To</Label>
          <Input id="f-to" type="date" value={filters.to} onChange={(e) => update('to', e.target.value)} />
        </div>
      </div>

      {logs.isPending ? (
        <Skeleton className="h-96" aria-busy="true" />
      ) : logs.data!.items.length === 0 ? (
        <EmptyState icon={ScrollText} title="No matching events" description="Try widening the filters." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Audit log</caption>
              <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">When</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Actor</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Action</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Details</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {logs.data!.items.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(e.createdAt)}</td>
                    <td className="px-4 py-3">
                      {e.actor ? (
                        <span className="flex items-center gap-2 whitespace-nowrap">
                          <Avatar name={e.actor.name} className="size-6 text-[10px]" />
                          {e.actor.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={variant(e.action)} className="font-mono">
                        {e.action}
                      </Badge>
                    </td>
                    <td className="max-w-xs px-4 py-3 text-muted-foreground">{describe(e)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{e.ip ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t px-4 py-2.5 text-sm text-muted-foreground">
            <span>
              {logs.data!.total} events · page {logs.data!.page} of {logs.data!.totalPages}
            </span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" className="size-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} aria-label="Previous page">
                <ChevronLeft />
              </Button>
              <Button variant="outline" size="icon" className="size-8" disabled={page >= logs.data!.totalPages} onClick={() => setPage((p) => p + 1)} aria-label="Next page">
                <ChevronRight />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
