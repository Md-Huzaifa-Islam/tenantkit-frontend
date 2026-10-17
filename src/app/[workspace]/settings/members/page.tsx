'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MailPlus, RotateCw, Trash2, UserMinus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { handlePlanLimit } from '@/components/upgrade-prompt';
import { api, errorMessage } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { keys, useMembers } from '@/lib/queries';
import { ASSIGNABLE_ROLES, canManageMember, createInviteSchema, PLANS, type CreateInviteInput, type Role } from '@/lib/shared';
import type { Invite } from '@/lib/types';
import { formatDate } from '@/lib/utils';

const roleVariant: Record<Role, 'default' | 'secondary' | 'outline'> = { OWNER: 'default', ADMIN: 'secondary', MEMBER: 'outline' };

export default function MembersPage() {
  const { workspace, can } = useWorkspace();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const wsId = workspace.id;
  const members = useMembers(wsId);
  const canInvite = can('member.invite');
  const invites = useQuery({
    queryKey: keys.invites(wsId),
    queryFn: () => api<Invite[]>(`/workspaces/${wsId}/invites`, { workspaceId: wsId }),
    enabled: canInvite,
  });
  const [inviting, setInviting] = useState(false);
  const form = useForm<CreateInviteInput>({ resolver: zodResolver(createInviteSchema), defaultValues: { email: '', role: 'MEMBER' } });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: keys.members(wsId) });
    queryClient.invalidateQueries({ queryKey: keys.invites(wsId) });
  };

  const onInvite = form.handleSubmit(async (values) => {
    try {
      await api(`/workspaces/${wsId}/invites`, { method: 'POST', body: values, workspaceId: wsId });
      toast.success(`Invitation sent to ${values.email}`);
      setInviting(false);
      form.reset();
      refresh();
    } catch (err) {
      if (handlePlanLimit(err)) return setInviting(false);
      applyApiError(err, form.setError, ['email', 'role']);
    }
  });

  async function act(fn: () => Promise<unknown>, success: string) {
    try {
      await fn();
      toast.success(success);
      refresh();
    } catch (err) {
      if (!handlePlanLimit(err)) toast.error(errorMessage(err));
    }
  }

  const limit = PLANS[workspace.plan].maxMembers;
  const used = (members.data?.length ?? 0) + (invites.data?.length ?? 0);

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {limit ? `${used} of ${limit} seats used (including pending invites).` : 'Unlimited seats on your plan.'}
            </CardDescription>
          </div>
          {canInvite && (
            <Button onClick={() => setInviting(true)}>
              <MailPlus aria-hidden /> Invite
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {members.isPending ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <ul className="divide-y">
              {members.data!.map((m) => {
                const manageable = can('member.updateRole') && m.user.id !== user?.id && canManageMember(workspace.role, m.role);
                return (
                  <li key={m.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <Avatar name={m.user.name} src={m.user.avatarUrl} className="size-9 text-xs" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {m.user.name} {m.user.id === user?.id && <span className="text-muted-foreground">(you)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.user.email} · joined {formatDate(m.joinedAt)}
                      </p>
                    </div>
                    {manageable ? (
                      <div className="flex items-center gap-1">
                        <label htmlFor={`role-${m.id}`} className="sr-only">
                          Role for {m.user.name}
                        </label>
                        <NativeSelect
                          id={`role-${m.id}`}
                          value={m.role}
                          className="h-8 w-28 text-xs"
                          onChange={(e) =>
                            act(
                              () => api(`/members/${m.id}`, { method: 'PATCH', body: { role: e.target.value }, workspaceId: wsId }),
                              `${m.user.name} is now ${e.target.value.toLowerCase()}`,
                            )
                          }
                        >
                          {ASSIGNABLE_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r[0] + r.slice(1).toLowerCase()}
                            </option>
                          ))}
                        </NativeSelect>
                        <ConfirmDialog
                          title={`Remove ${m.user.name}?`}
                          description="They lose access immediately and their tasks become unassigned."
                          confirmLabel="Remove"
                          onConfirm={() => act(() => api(`/members/${m.id}`, { method: 'DELETE', workspaceId: wsId }), `${m.user.name} removed`)}
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8" aria-label={`Remove ${m.user.name}`}>
                              <UserMinus aria-hidden />
                            </Button>
                          }
                        />
                      </div>
                    ) : (
                      <Badge variant={roleVariant[m.role]}>{m.role[0] + m.role.slice(1).toLowerCase()}</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
            <CardDescription>Links expire after 7 days. Resending issues a fresh link.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {invites.data?.length ? (
              <ul className="divide-y">
                {invites.data.map((inv) => (
                  <li key={inv.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.role.toLowerCase()} · invited by {inv.invitedBy} · expires {formatDate(inv.expiresAt)}
                      </p>
                    </div>
                    {inv.status === 'EXPIRED' && <Badge variant="warning">Expired</Badge>}
                    <Button variant="ghost" size="sm" onClick={() => act(() => api(`/invites/${inv.id}/resend`, { method: 'POST', workspaceId: wsId }), 'Invitation resent')}>
                      <RotateCw aria-hidden /> Resend
                    </Button>
                    <ConfirmDialog
                      title="Revoke invitation?"
                      description={`The link sent to ${inv.email} will stop working.`}
                      confirmLabel="Revoke"
                      onConfirm={() => act(() => api(`/invites/${inv.id}`, { method: 'DELETE', workspaceId: wsId }), 'Invitation revoked')}
                      trigger={
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 aria-hidden /> Revoke
                        </Button>
                      }
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-5 pb-5 text-sm text-muted-foreground">No pending invitations.</p>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={inviting} onOpenChange={setInviting}>
        <DialogContent title="Invite a teammate" description="They'll get an email with a link to join.">
          <form onSubmit={onInvite} className="grid gap-4" noValidate>
            <Field label="Email" htmlFor="invite-email" error={form.formState.errors.email?.message}>
              <Input id="invite-email" type="email" autoFocus {...form.register('email')} />
            </Field>
            <Field label="Role" htmlFor="invite-role">
              <NativeSelect id="invite-role" {...form.register('role')}>
                <option value="MEMBER">Member — works on tasks</option>
                <option value="ADMIN">Admin — manages members and projects</option>
              </NativeSelect>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setInviting(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Send invitation
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
