'use client';

import { Eye, MailWarning } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { api, errorMessage } from '@/lib/api';

export function ImpersonationBanner() {
  const { impersonation, user, exitImpersonation } = useAuth();
  if (!impersonation || !user) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-warning px-4 py-2 text-center text-sm font-medium text-black">
      <Eye className="size-4" aria-hidden />
      Viewing {impersonation.workspaceName} as {user.email} — read only
      <Button size="sm" variant="outline" className="h-7 border-black/30 bg-white/60 text-black hover:bg-white" onClick={() => void exitImpersonation()}>
        Exit
      </Button>
    </div>
  );
}

export function VerifyEmailBanner() {
  const { user, impersonation } = useAuth();
  const [sent, setSent] = useState(false);
  if (!user || user.emailVerified || impersonation) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b bg-accent px-4 py-2 text-sm text-accent-foreground">
      <MailWarning className="size-4" aria-hidden />
      Please verify {user.email}.
      <button
        type="button"
        disabled={sent}
        className="font-medium underline underline-offset-2 disabled:no-underline disabled:opacity-70"
        onClick={async () => {
          try {
            await api('/auth/verify/resend', { method: 'POST' });
            setSent(true);
            toast.success('Verification email sent');
          } catch (err) {
            toast.error(errorMessage(err));
          }
        }}
      >
        {sent ? 'Email sent' : 'Resend email'}
      </button>
    </div>
  );
}
