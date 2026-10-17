'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ImageUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { api, errorMessage } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { keys, useMembers } from '@/lib/queries';
import { slugSchema } from '@/lib/shared';

const schema = z.object({ name: z.string().trim().min(2, 'At least 2 characters').max(64), slug: slugSchema });

export default function GeneralSettingsPage() {
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const members = useMembers(workspace.id);
  const editable = can('workspace.update');
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), values: { name: workspace.name, slug: workspace.slug } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await api(`/workspaces/${workspace.id}`, { method: 'PATCH', body: values, workspaceId: workspace.id });
      await queryClient.invalidateQueries({ queryKey: keys.workspaces });
      toast.success('Settings saved');
      if (values.slug !== workspace.slug) router.replace(`/${values.slug}/settings/general`);
    } catch (err) {
      applyApiError(err, form.setError, ['name', 'slug']);
    }
  });

  async function uploadLogo(file: File) {
    if (file.size > 1024 * 1024) return toast.error('Logo must be 1 MB or smaller');
    const data = new FormData();
    data.append('file', file);
    setUploading(true);
    try {
      await api(`/workspaces/${workspace.id}/logo`, { method: 'POST', formData: data, workspaceId: workspace.id });
      await queryClient.invalidateQueries({ queryKey: keys.workspaces });
      toast.success('Logo updated');
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const candidates = (members.data ?? []).filter((m) => m.role !== 'OWNER');

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>The name and URL your team sees.</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit} noValidate>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="ws-name" error={form.formState.errors.name?.message}>
              <Input id="ws-name" disabled={!editable} {...form.register('name')} />
            </Field>
            <Field label="URL" htmlFor="ws-slug" error={form.formState.errors.slug?.message} hint="Lowercase letters, numbers and dashes.">
              <div className="flex items-center rounded-md border border-input bg-muted/50 focus-within:outline-2 focus-within:outline-ring">
                <span className="pl-3 text-sm text-muted-foreground">/</span>
                <Input id="ws-slug" disabled={!editable} className="border-0 bg-transparent shadow-none focus-visible:outline-none" {...form.register('slug')} />
              </div>
            </Field>
          </CardContent>
          {editable && (
            <CardFooter className="justify-end">
              <Button type="submit" loading={form.formState.isSubmitting} disabled={!form.formState.isDirty}>
                Save changes
              </Button>
            </CardFooter>
          )}
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo</CardTitle>
          <CardDescription>PNG, JPEG or WebP, up to 1 MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {workspace.logoUrl ? (
            <img src={workspace.logoUrl} alt={`${workspace.name} logo`} className="size-16 rounded-xl border object-cover" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-xl bg-primary text-2xl font-bold text-primary-foreground" aria-hidden>
              {workspace.name[0]?.toUpperCase()}
            </div>
          )}
          {editable && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                id="logo-input"
                onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
              />
              <Button variant="outline" loading={uploading} onClick={() => fileRef.current?.click()}>
                <ImageUp aria-hidden /> Upload logo
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {can('workspace.transfer') && (
        <Card>
          <CardHeader>
            <CardTitle>Transfer ownership</CardTitle>
            <CardDescription>The new owner gets full control including billing. You become an admin.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="transfer-to" className="sr-only">
              New owner
            </label>
            <NativeSelect id="transfer-to" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} className="sm:max-w-xs">
              <option value="">Choose a member…</option>
              {candidates.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name} ({m.role.toLowerCase()})
                </option>
              ))}
            </NativeSelect>
            <ConfirmDialog
              title="Transfer ownership?"
              description="You will lose owner permissions, including billing and deleting the workspace."
              confirmLabel="Transfer"
              onConfirm={async () => {
                try {
                  await api(`/workspaces/${workspace.id}/transfer`, { method: 'POST', body: { userId: transferTo }, workspaceId: workspace.id });
                  await queryClient.invalidateQueries();
                  toast.success('Ownership transferred');
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
              trigger={
                <Button variant="outline" disabled={!transferTo}>
                  Transfer
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {can('workspace.delete') && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Delete workspace</CardTitle>
            <CardDescription>Permanently deletes all projects, tasks, members and audit history.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConfirmDialog
              title={`Delete ${workspace.name}?`}
              description="Everything in this workspace will be permanently deleted. This cannot be undone."
              confirmLabel="Delete workspace"
              onConfirm={async () => {
                try {
                  await api(`/workspaces/${workspace.id}`, { method: 'DELETE', workspaceId: workspace.id });
                  await queryClient.invalidateQueries({ queryKey: keys.workspaces });
                  toast.success('Workspace deleted');
                  router.replace('/');
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              }}
              trigger={<Button variant="destructive">Delete workspace</Button>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
