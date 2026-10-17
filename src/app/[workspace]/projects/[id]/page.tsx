'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Board, type Columns } from '@/components/kanban/board';
import { TaskDialog, type TaskFormValues } from '@/components/kanban/task-dialog';
import { useWorkspace } from '@/components/shell/workspace-context';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input, Textarea } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { api, errorMessage } from '@/lib/api';
import { applyApiError } from '@/lib/forms';
import { keys, useMembers } from '@/lib/queries';
import { updateProjectSchema, type TaskStatus, type UpdateProjectInput } from '@/lib/shared';
import type { Project, Task } from '@/lib/types';

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const { workspace, can, readOnly } = useWorkspace();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const wsId = workspace.id;

  const project = useQuery({ queryKey: keys.project(wsId, id), queryFn: () => api<Project>(`/projects/${id}`, { workspaceId: wsId }) });
  const tasks = useQuery({ queryKey: keys.tasks(wsId, id), queryFn: () => api<Task[]>(`/projects/${id}/tasks`, { workspaceId: wsId }) });
  const members = useMembers(wsId);

  const [dialog, setDialog] = useState<{ open: boolean; task: Task | null; status: TaskStatus }>({ open: false, task: null, status: 'TODO' });
  const [editingProject, setEditingProject] = useState(false);
  const projectForm = useForm<UpdateProjectInput>({ resolver: zodResolver(updateProjectSchema) });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: keys.tasks(wsId, id) });
    queryClient.invalidateQueries({ queryKey: keys.projects(wsId) });
  };

  const canEditTask = (t: Task | null) =>
    !t || can('task.manageAny') || (can('task.create') && (t.createdById === user?.id || t.assignee?.id === user?.id));

  async function saveTask(values: TaskFormValues) {
    const body = { title: values.title, status: values.status, assigneeId: values.assigneeId || null, dueDate: values.dueDate || null };
    try {
      if (dialog.task) {
        await api(`/tasks/${dialog.task.id}`, { method: 'PATCH', body, workspaceId: wsId });
        toast.success('Task updated');
      } else {
        await api(`/projects/${id}/tasks`, { method: 'POST', body, workspaceId: wsId });
        toast.success('Task added');
      }
      setDialog((d) => ({ ...d, open: false }));
      invalidate();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  async function deleteTask() {
    await api(`/tasks/${dialog.task!.id}`, { method: 'DELETE', workspaceId: wsId }).catch((err) => {
      toast.error(errorMessage(err));
      throw err;
    });
    setDialog((d) => ({ ...d, open: false }));
    toast.success('Task deleted');
    invalidate();
  }

  async function persistOrder(columns: Array<{ status: TaskStatus; taskIds: string[] }>, next: Columns) {
    const previous = queryClient.getQueryData<Task[]>(keys.tasks(wsId, id));
    const optimistic = (Object.keys(next) as TaskStatus[]).flatMap((s) => next[s].map((t, position) => ({ ...t, status: s, position })));
    queryClient.setQueryData(keys.tasks(wsId, id), optimistic);
    try {
      await api('/tasks/reorder', { method: 'POST', body: { projectId: id, columns }, workspaceId: wsId });
      queryClient.invalidateQueries({ queryKey: keys.projects(wsId) });
    } catch (err) {
      queryClient.setQueryData(keys.tasks(wsId, id), previous);
      toast.error(errorMessage(err));
      throw err;
    }
  }

  const updateProject = useMutation({
    mutationFn: (values: UpdateProjectInput) => api<Project>(`/projects/${id}`, { method: 'PATCH', body: values, workspaceId: wsId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.project(wsId, id) });
      queryClient.invalidateQueries({ queryKey: keys.projects(wsId) });
      setEditingProject(false);
      toast.success('Project updated');
    },
    onError: (err) => applyApiError(err, projectForm.setError, ['name', 'description']),
  });

  if (project.isError) {
    return (
      <div className="text-sm text-muted-foreground">
        {errorMessage(project.error)}.{' '}
        <Link className="text-primary underline" href={`/${workspace.slug}/projects`}>
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6">
        <Link href={`/${workspace.slug}/projects`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          {project.isPending ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{project.data.name}</h1>
              {project.data.description && <p className="mt-1 text-sm text-muted-foreground">{project.data.description}</p>}
            </div>
          )}
          {(can('project.update') || can('project.delete')) && project.data && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Project actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {can('project.update') && (
                  <DropdownMenuItem
                    onSelect={() => {
                      projectForm.reset({ name: project.data.name, description: project.data.description });
                      setEditingProject(true);
                    }}
                  >
                    <Pencil /> Edit project
                  </DropdownMenuItem>
                )}
                {can('project.delete') && (
                  <ConfirmDialog
                    title={`Delete ${project.data.name}?`}
                    description="All of its tasks will be deleted. This cannot be undone."
                    confirmLabel="Delete project"
                    onConfirm={async () => {
                      await api(`/projects/${id}`, { method: 'DELETE', workspaceId: wsId });
                      queryClient.invalidateQueries({ queryKey: keys.projects(wsId) });
                      toast.success('Project deleted');
                      router.push(`/${workspace.slug}/projects`);
                    }}
                    trigger={
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                        <Trash2 /> Delete project
                      </DropdownMenuItem>
                    }
                  />
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {tasks.isPending ? (
        <div className="flex gap-3" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-80 min-w-[17rem] flex-1" />
          ))}
        </div>
      ) : (
        <Board
          tasks={tasks.data ?? []}
          canAdd={can('task.create')}
          readOnly={readOnly}
          onAdd={(status) => setDialog({ open: true, task: null, status })}
          onOpen={(task) => setDialog({ open: true, task, status: task.status })}
          onPersist={persistOrder}
        />
      )}

      <TaskDialog
        open={dialog.open}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
        task={dialog.task}
        defaultStatus={dialog.status}
        members={members.data ?? []}
        canDelete={canEditTask(dialog.task)}
        readOnly={readOnly || !canEditTask(dialog.task)}
        onSubmit={saveTask}
        onDelete={deleteTask}
      />

      <Dialog open={editingProject} onOpenChange={setEditingProject}>
        <DialogContent title="Edit project">
          <form onSubmit={projectForm.handleSubmit((v) => updateProject.mutate(v))} className="grid gap-4" noValidate>
            <Field label="Name" htmlFor="edit-project-name" error={projectForm.formState.errors.name?.message}>
              <Input id="edit-project-name" {...projectForm.register('name')} />
            </Field>
            <Field label="Description" htmlFor="edit-project-description">
              <Textarea id="edit-project-description" rows={3} {...projectForm.register('description')} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditingProject(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={updateProject.isPending}>
                Save
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
