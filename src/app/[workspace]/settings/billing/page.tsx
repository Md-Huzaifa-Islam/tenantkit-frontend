'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UsageMeter } from '@/components/usage-meter';
import { api, errorMessage } from '@/lib/api';
import { keys } from '@/lib/queries';
import { PLANS, type PlanId } from '@/lib/shared';
import type { BillingStatus } from '@/lib/types';
import { cn, formatDate, formatMoney } from '@/lib/utils';

const ORDER: PlanId[] = ['FREE', 'PRO', 'BUSINESS'];

function Billing() {
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const [busy, setBusy] = useState<string | null>(null);
  const status = useQuery({
    queryKey: keys.billing(workspace.id),
    queryFn: () => api<BillingStatus>('/billing/status', { workspaceId: workspace.id }),
  });

  useEffect(() => {
    const result = params.get('checkout');
    if (result === 'success') {
      toast.success('Subscription active. Thanks for upgrading!');
      queryClient.invalidateQueries({ queryKey: keys.workspaces });
    } else if (result === 'cancelled') {
      toast.info('Checkout cancelled. No changes were made.');
    }
  }, [params, queryClient]);

  async function go(path: '/billing/checkout' | '/billing/portal', body: object | undefined, key: string) {
    setBusy(key);
    try {
      const { url } = await api<{ url: string }>(path, { method: 'POST', body, workspaceId: workspace.id });
      window.location.assign(url);
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(null);
    }
  }

  if (status.isPending) return <Skeleton className="h-72" aria-busy="true" />;
  if (status.isError) return <p className="text-sm text-destructive">{errorMessage(status.error)}</p>;
  const s = status.data;
  const manage = can('billing.manage');

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              {PLANS[s.plan].name} plan
              {s.provider === 'mock' && <Badge variant="outline">Test mode</Badge>}
            </CardTitle>
            <CardDescription>
              {s.plan === 'FREE'
                ? 'Free forever for small teams.'
                : `${formatMoney(PLANS[s.plan].priceMonthlyCents)}/month${s.currentPeriodEnd ? ` · renews ${formatDate(s.currentPeriodEnd)}` : ''}`}
            </CardDescription>
          </div>
          {manage && s.hasSubscription && (
            <Button variant="outline" loading={busy === 'portal'} onClick={() => go('/billing/portal', undefined, 'portal')}>
              Manage billing <ExternalLink aria-hidden />
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <UsageMeter label="Projects" usage={s.usage.projects} />
          <UsageMeter label="Members (incl. invites)" usage={s.usage.members} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {ORDER.map((id) => {
          const plan = PLANS[id];
          const current = id === s.plan;
          const isUpgrade = ORDER.indexOf(id) > ORDER.indexOf(s.plan);
          return (
            <Card key={id} className={cn('flex flex-col', current && 'border-primary ring-1 ring-primary')}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {current && <Badge>Current</Badge>}
                </div>
                <p className="mt-2 text-3xl font-semibold tracking-tight">
                  {formatMoney(plan.priceMonthlyCents)}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col">
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden /> {f}
                    </li>
                  ))}
                </ul>
                {manage && !current && id !== 'FREE' && (
                  <Button
                    className="mt-5"
                    variant={isUpgrade ? 'default' : 'outline'}
                    loading={busy === id}
                    onClick={() => (s.hasSubscription ? go('/billing/portal', undefined, id) : go('/billing/checkout', { plan: id }, id))}
                  >
                    {s.hasSubscription ? `Switch to ${plan.name}` : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      {!manage && <p className="text-sm text-muted-foreground">Only the workspace owner can change the plan.</p>}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense>
      <Billing />
    </Suspense>
  );
}
