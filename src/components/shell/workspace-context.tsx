'use client';

import * as React from 'react';
import { can as canRole, type Permission } from '@/lib/shared';
import type { WorkspaceSummary } from '@/lib/types';

interface WorkspaceContextValue {
  workspace: WorkspaceSummary;
  can(permission: Permission): boolean;
  readOnly: boolean;
}

const Ctx = React.createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ workspace, readOnly, children }: { workspace: WorkspaceSummary; readOnly: boolean; children: React.ReactNode }) {
  const value = React.useMemo(
    () => ({
      workspace,
      readOnly,
      // During read-only impersonation every write is hidden; the API enforces it anyway.
      can: (p: Permission) => canRole(workspace.role, p) && (!readOnly || p.endsWith('.read')),
    }),
    [workspace, readOnly],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error('useWorkspace must be used inside a workspace route');
  return ctx;
}
