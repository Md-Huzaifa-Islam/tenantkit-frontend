'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { keys, useWorkspaces } from '@/lib/queries';
import { createWorkspaceSchema, PLANS, type CreateWorkspaceInput } from '@/lib/shared';
import { useWorkspace } from './workspace-context';

function WorkspaceMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    <img src={logoUrl} alt="" className="size-7 rounded-md object-cover" />
  ) : (
    <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground" aria-hidden>
      {name[0]?.toUpperCase()}
    </span>
  );
}

export function WorkspaceSwitcher() {
  const { workspace, readOnly } = useWorkspace();
  const { data: workspaces = [] } = useWorkspaces();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const form = useForm<CreateWorkspaceInput>({ resolver: zodResolver(createWorkspaceSchema), defaultValues: { name: '' } });

  const onCreate = form.handleSubmit(async (values) => {
    try {
      const ws = await api<{ slug: string }>('/workspaces', { method: 'POST', body: { name: values.name } });
      await queryClient.invalidateQueries({ queryKey: keys.workspaces });
      setCreating(false);
      form.reset();
      router.push(`/${ws.slug}/projects`);
    } catch (err) {
      applyApiError(err, form.setError, ['name']);
    }
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center gap-2.5 rounded-lg border bg-card px-2 py-1.5 text-left shadow-xs transition-colors hover:bg-accent"
            aria-label={`Current workspace: ${workspace.name}. Switch workspace`}
          >
            <WorkspaceMark name={workspace.name} logoUrl={workspace.logoUrl} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{workspace.name}</span>
              <span className="block text-xs text-muted-foreground">{PLANS[workspace.plan].name} plan</span>
            </span>
            <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((w) => (
            <DropdownMenuItem key={w.id} onSelect={() => router.push(`/${w.slug}/projects`)}>
              <WorkspaceMark name={w.name} logoUrl={w.logoUrl} />
              <span className="flex-1 truncate">{w.name}</span>
              {w.id === workspace.id && <Check className="text-primary" aria-label="Current" />}
            </DropdownMenuItem>
          ))}
          {!readOnly && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setCreating(true)}>
                <Plus /> Create workspace
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent title="Create a workspace" description="Workspaces keep projects, members and billing separate.">
          <form onSubmit={onCreate} className="grid gap-4" noValidate>
            <Field label="Workspace name" htmlFor="new-ws-name" error={form.formState.errors.name?.message}>
              <Input id="new-ws-name" autoFocus placeholder="Side project" {...form.register('name')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={form.formState.isSubmitting}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
