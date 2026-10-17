import { useQuery } from '@tanstack/react-query';
import { api } from './api';
import type { Member, WorkspaceSummary } from './types';

export const keys = {
  workspaces: ['workspaces'] as const,
  workspace: (id: string) => ['workspace', id] as const,
  members: (id: string) => ['members', id] as const,
  invites: (id: string) => ['invites', id] as const,
  projects: (id: string) => ['projects', id] as const,
  project: (id: string, projectId: string) => ['project', id, projectId] as const,
  tasks: (id: string, projectId: string) => ['tasks', id, projectId] as const,
  billing: (id: string) => ['billing', id] as const,
  audit: (id: string, params: string) => ['audit', id, params] as const,
};

export function useWorkspaces(enabled = true) {
  return useQuery({ queryKey: keys.workspaces, queryFn: () => api<WorkspaceSummary[]>('/me/workspaces'), enabled });
}

export function useMembers(workspaceId: string) {
  return useQuery({
    queryKey: keys.members(workspaceId),
    queryFn: () => api<Member[]>(`/workspaces/${workspaceId}/members`, { workspaceId }),
  });
}
