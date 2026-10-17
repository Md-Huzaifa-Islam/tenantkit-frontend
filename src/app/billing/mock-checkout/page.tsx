'use client';

import { useQuery } from '@tanstack/react-query';
import { CreditCard, Lock } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';
import type { PlanDefinition } from '@/lib/shared';
import { formatMoney } from '@/lib/utils';

interface Session {
  kind: string;
  workspace: { name: string; slug: string };
  plan: PlanDefinition | null;
}

function Checkout() {
  const token = useSearchParams().get('session') ?? '';
  const [paying, setPaying] = useState(false);
  const session = useQuery({
    queryKey: ['mock-session', token],
    queryFn: () => api<Session>('/billing/mock/session', { method: 'POST', body: { session: token } }),
    retry: false,
  });

  if (session.isPending) return <Skeleton className="h-80 bg-white" />;
  if (session.isError || !session.data.plan) {
    return <div className="rounded-xl bg-white p-6 shadow">{errorMessage(session.error, 'Invalid checkout session')}</div>;
  }
  const { workspace, plan } = session.data;

  async function pay() {
    setPaying(true);
    try {
      const res = await api<{ redirectUrl: string }>('/billing/mock/checkout/complete', { method: 'POST', body: { session: token } });
      window.location.assign(new URL(res.redirectUrl).pathname + new URL(res.redirectUrl).search);
    } catch (err) {
      toast.error(errorMessage(err));
      setPaying(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-lg">
      <div className="border-b p-6">
        <p className="text-sm text-[#697386]">Subscribe to TenantKit {plan.name}</p>
        <p className="mt-1 text-4xl font-semibold">
          {formatMoney(plan.priceMonthlyCents)} <span className="text-base font-normal text-[#697386]">per month</span>
        </p>
        <p className="mt-2 text-sm text-[#697386]">Workspace: {workspace.name}</p>
      </div>
      <div className="grid gap-4 p-6">
        <div>
          <p className="mb-1.5 text-sm font-medium">Card information</p>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2.5 font-mono text-sm text-[#697386]">
            <CreditCard className="size-4" aria-hidden /> 4242 4242 4242 4242 <span className="ml-auto">12/34 · 123</span>
          </div>
        </div>
        <Button className="h-11 bg-[#635bff] text-white hover:bg-[#5146e5]" loading={paying} onClick={pay}>
          Pay {formatMoney(plan.priceMonthlyCents)}
        </Button>
        <a href={`/${workspace.slug}/settings/billing?checkout=cancelled`} className="text-center text-sm text-[#697386] hover:underline">
          Cancel and return
        </a>
        <p className="flex items-center justify-center gap-1 text-xs text-[#697386]">
          <Lock className="size-3" aria-hidden /> Simulated checkout. Emits the same webhook events as Stripe.
        </p>
      </div>
    </div>
  );
}

export default function MockCheckoutPage() {
  return (
    <Suspense>
      <Checkout />
    </Suspense>
  );
}
