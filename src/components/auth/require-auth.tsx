'use client';

import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from './auth-provider';

/** Redirects to /login (remembering where the user was going) when signed out. */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (status === 'unauthenticated') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);

  if (status !== 'authenticated') {
    return (
      <div className="flex min-h-dvh" aria-busy="true" aria-label="Loading">
        <div className="hidden w-64 border-r bg-sidebar p-4 md:block">
          <Skeleton className="h-9 w-full" />
          <div className="mt-6 space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-6 h-40 w-full" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
