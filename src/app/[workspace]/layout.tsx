'use client';

import { Ban, SearchX } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { RequireAuth } from '@/components/auth/require-auth';
import { AppShell } from '@/components/shell/app-shell';
import { WorkspaceProvider } from '@/components/shell/workspace-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useWorkspaces } from '@/lib/queries';

function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const { workspace: slug } = useParams<{ workspace: string }>();
  const { impersonation } = useAuth();
  const { data, isPending } = useWorkspaces();

  if (isPending) {
    return (
      <div className="p-8" aria-busy="true">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-6 h-48 w-full" />
      </div>
    );
  }
  const workspace = data?.find((w) => w.slug === slug);
  if (!workspace) {
    return (
      <div className="mx-auto max-w-lg p-8">
        <EmptyState
          icon={SearchX}
          title="Workspace not found"
          description="It doesn't exist or you're not a member."
          action={
            <Button asChild>
              <Link href={data?.[0] ? `/${data[0].slug}/projects` : '/login'}>Go to my workspace</Link>
            </Button>
          }
        />
      </div>
    );
  }
  return (
    <WorkspaceProvider workspace={workspace} readOnly={Boolean(impersonation)}>
      <AppShell>
        {workspace.status === 'SUSPENDED' ? (
          <EmptyState
            icon={Ban}
            title="This workspace is suspended"
            description="Access has been paused by the platform team. Contact support to restore it."
          />
        ) : (
          children
        )}
      </AppShell>
    </WorkspaceProvider>
  );
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <WorkspaceGate>{children}</WorkspaceGate>
    </RequireAuth>
  );
}
