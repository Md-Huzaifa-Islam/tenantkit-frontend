'use client';

import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';
import { PLANS, type PlanDefinition, type PlanId } from '@/lib/shared';
import { formatDate, formatMoney } from '@/lib/utils';

interface Session {
  workspace: { name: string; slug: string; plan: PlanId; currentPeriodEnd: string | null };
  plans: PlanDefinition[];
}

function Portal() {
  const token = useSearchParams().get('session') ?? '';
  const [busy, setBusy] = useState<string | null>(null);
  const session = useQuery({
    queryKey: ['mock-portal', token],
    queryFn: () => api<Session>('/billing/mock/session', { method: 'POST', body: { session: token } }),
    retry: false,
  });

  async function act(action: 'change_plan' | 'cancel' | 'fail_payment', plan?: PlanId) {
    setBusy(plan ?? action);
    try {
      const res = await api<{ redirectUrl: string }>('/billing/mock/portal/action', { method: 'POST', body: { session: token, action, plan } });
      if (action === 'fail_payment') {
        toast.warning('Simulated a failed payment. The owner was emailed (see the dev mailbox).');
        setBusy(null);
        return;
      }
      window.location.assign(new URL(res.redirectUrl).pathname);
    } catch (err) {
      toast.error(errorMessage(err));
      setBusy(null);
    }
  }

  if (session.isPending) return <Skeleton className="h-80 bg-white" />;
  if (session.isError) return <div className="rounded-xl bg-white p-6 shadow">{errorMessage(session.error)}</div>;
  const { workspace, plans } = session.data;

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="border-b p-6">
        <p className="text-sm text-[#697386]">Billing portal · {workspace.name}</p>
        <p className="mt-1 text-2xl font-semibold">
          {PLANS[workspace.plan].name} · {formatMoney(PLANS[workspace.plan].priceMonthlyCents)}/mo
        </p>
        {workspace.currentPeriodEnd && <p className="mt-1 text-sm text-[#697386]">Renews {formatDate(workspace.currentPeriodEnd)}</p>}
      </div>
      <div className="grid gap-3 p-6">
        {plans
          .filter((p) => p.id !== workspace.plan)
          .map((p) => (
            <Button key={p.id} variant="outline" className="h-11 justify-between border-[#e3e8ee]" loading={busy === p.id} onClick={() => act('change_plan', p.id)}>
              Switch to {p.name} <span className="text-[#697386]">{formatMoney(p.priceMonthlyCents)}/mo</span>
            </Button>
          ))}
        <Button variant="outline" className="h-11 border-[#e3e8ee]" loading={busy === 'fail_payment'} onClick={() => act('fail_payment')}>
          Simulate a failed payment
        </Button>
        <Button variant="destructive" className="h-11" loading={busy === 'cancel'} onClick={() => act('cancel')}>
          Cancel subscription
        </Button>
        <a href={`/${workspace.slug}/settings/billing`} className="mt-1 text-center text-sm text-[#697386] hover:underline">
          Return to TenantKit
        </a>
      </div>
    </div>
  );
}

export default function MockPortalPage() {
  return (
    <Suspense>
      <Portal />
    </Suspense>
  );
}
