'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FolderKanban, Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shell/app-shell';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { EmptyState } from '@/components/ui/empty-state';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { handlePlanLimit } from '@/components/upgrade-prompt';
import { api } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { keys } from '@/lib/queries';
import { createProjectSchema, PLANS, type CreateProjectInput } from '@/lib/shared';
import type { Project } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const { workspace, can } = useWorkspace();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const projects = useQuery({
    queryKey: keys.projects(workspace.id),
    queryFn: () => api<Project[]>('/projects', { workspaceId: workspace.id }),
  });
  const form = useForm<CreateProjectInput>({ resolver: zodResolver(createProjectSchema), defaultValues: { name: '', description: '' } });

  const create = useMutation({
    mutationFn: (values: CreateProjectInput) => api<Project>('/projects', { method: 'POST', body: values, workspaceId: workspace.id }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: keys.projects(workspace.id) });
      setOpen(false);
      form.reset();
      toast.success(`Created ${project.name}`);
    },
    onError: (err) => {
      if (handlePlanLimit(err)) return setOpen(false);
      applyApiError(err, form.setError, ['name', 'description']);
    },
  });

  const limit = PLANS[workspace.plan].maxProjects;
  const count = projects.data?.length ?? 0;
  const newButton = can('project.create') && (
    <Button onClick={() => setOpen(true)}>
      <Plus aria-hidden /> New project
    </Button>
  );

  return (
    <>
      <PageHeader
        title="Projects"
        description={limit ? `${count} of ${limit} projects on the ${PLANS[workspace.plan].name} plan` : 'Plan your work and track it on a board.'}
        actions={newButton}
      />

      {projects.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={can('project.create') ? 'Create your first project to start organising tasks on a Kanban board.' : 'An owner or admin can create the first project.'}
          action={newButton}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data!.map((p) => {
            const total = p.taskCounts ? p.taskCounts.TODO + p.taskCounts.DOING + p.taskCounts.DONE : 0;
            const done = p.taskCounts?.DONE ?? 0;
            return (
              <li key={p.id}>
                <Link href={`/${workspace.slug}/projects/${p.id}`} className="block h-full rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
                  <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="mt-1 line-clamp-2 flex-1 text-sm text-muted-foreground">{p.description || 'No description'}</p>
                    <div className="mt-4">
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label="Tasks done" aria-valuenow={done} aria-valuemin={0} aria-valuemax={total}>
                        <div className="h-full rounded-full bg-success" style={{ width: total ? `${(done / total) * 100}%` : 0 }} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {done}/{total} done
                        </span>
                        <div className="flex gap-1">
                          {p.taskCounts?.DOING ? <Badge variant="warning">{p.taskCounts.DOING} in progress</Badge> : null}
                        </div>
                        <span>{formatDate(p.createdAt)}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="New project">
          <form onSubmit={form.handleSubmit((v) => create.mutate(v))} className="grid gap-4" noValidate>
            <Field label="Name" htmlFor="project-name" error={form.formState.errors.name?.message}>
              <Input id="project-name" autoFocus {...form.register('name')} />
            </Field>
            <Field label="Description" htmlFor="project-description" error={form.formState.errors.description?.message}>
              <Textarea id="project-description" rows={3} {...form.register('description')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={create.isPending}>
                Create project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
