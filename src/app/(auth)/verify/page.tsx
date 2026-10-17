'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef, useState } from 'react';
import { AuthCard } from '@/components/auth/auth-card';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';

function Verify() {
  const token = useSearchParams().get('token');
  const [state, setState] = useState<{ status: 'pending' | 'ok' | 'error'; message?: string }>({ status: 'pending' });
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    if (!token) return setState({ status: 'error', message: 'This verification link is missing its token.' });
    api('/auth/verify', { method: 'POST', body: { token }, noRefresh: true })
      .then(() => setState({ status: 'ok' }))
      .catch((err) => setState({ status: 'error', message: errorMessage(err) }));
  }, [token]);

  if (state.status === 'pending') {
    return (
      <AuthCard title="Verifying your email…">
        <Skeleton className="h-4 w-full" />
      </AuthCard>
    );
  }
  return (
    <AuthCard
      title={state.status === 'ok' ? 'Email verified' : 'Verification failed'}
      footer={<Link href="/login" className="font-medium text-primary hover:underline">Continue to TenantKit</Link>}
    >
      <div className="flex gap-3 text-sm text-muted-foreground">
        {state.status === 'ok' ? (
          <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        ) : (
          <XCircle className="size-5 shrink-0 text-destructive" aria-hidden />
        )}
        <p>{state.status === 'ok' ? 'Thanks! Your email address is confirmed.' : state.message}</p>
      </div>
    </AuthCard>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <Verify />
    </Suspense>
  );
}
