'use client';

import { Sparkles } from 'lucide-react';
import Link from 'next/link';
import { create } from './upgrade-store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api';
import { useWorkspace } from './shell/workspace-context';

export const upgradeStore = create();

/** Returns true (and opens the upgrade dialog) when the error is a plan-limit error. */
export function handlePlanLimit(err: unknown): boolean {
  if (err instanceof ApiError && err.code === 'PLAN_LIMIT_REACHED') {
    upgradeStore.open(err.message);
    return true;
  }
  return false;
}

export function UpgradePrompt() {
  const { workspace, can } = useWorkspace();
  const message = upgradeStore.useMessage();
  return (
    <Dialog open={message !== null} onOpenChange={(o) => !o && upgradeStore.close()}>
      <DialogContent title="Upgrade to keep growing" description={message ?? undefined}>
        <div className="flex items-start gap-3 rounded-lg bg-accent p-3 text-sm text-accent-foreground">
          <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Pro gives you unlimited projects and up to 10 members for $19/month. Business removes every limit.</p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => upgradeStore.close()}>
            Not now
          </Button>
          {can('billing.manage') ? (
            <Button asChild onClick={() => upgradeStore.close()}>
              <Link href={`/${workspace.slug}/settings/billing`}>See plans</Link>
            </Button>
          ) : (
            <p className="self-center text-sm text-muted-foreground">Ask your workspace owner to upgrade.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
