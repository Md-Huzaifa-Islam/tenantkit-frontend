import type { AuditAction, Permission, PlanDefinition, PlanId, Role, TaskStatus } from './shared';

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  plan: PlanId;
  status: 'ACTIVE' | 'SUSPENDED';
  role: Role;
  permissions: Permission[];
}

export interface Usage {
  used: number;
  limit: number | null;
}

export interface WorkspaceDetails extends Omit<WorkspaceSummary, 'permissions'> {
  createdAt: string;
  usage: { projects: Usage; members: Usage };
}

export interface Member {
  id: string;
  role: Role;
  joinedAt: string;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  invitedBy?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  createdBy?: { id: string; name: string };
  taskCounts?: Record<TaskStatus, number>;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  status: TaskStatus;
  position: number;
  dueDate: string | null;
  assignee: { id: string; name: string; avatarUrl: string | null } | null;
  createdById: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  action: AuditAction | string;
  actor: { id: string; name: string; email: string } | null;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  ip: string | null;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BillingStatus {
  plan: PlanId;
  provider: 'mock' | 'stripe';
  hasSubscription: boolean;
  currentPeriodEnd: string | null;
  usage: { projects: Usage; members: Usage };
  plans: PlanDefinition[];
}
