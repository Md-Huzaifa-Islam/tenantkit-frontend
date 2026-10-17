'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input, NativeSelect } from '@/components/ui/input';
import { Field } from '@/components/ui/label';
import { TASK_STATUSES, taskStatusSchema } from '@/lib/shared';
import type { Member, Task } from '@/lib/types';

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  status: taskStatusSchema,
  assigneeId: z.string(),
  dueDate: z.string(),
});
export type TaskFormValues = z.infer<typeof schema>;

export const STATUS_LABEL = { TODO: 'To do', DOING: 'In progress', DONE: 'Done' } as const;

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus,
  members,
  canDelete,
  readOnly,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: Task | null;
  defaultStatus: Task['status'];
  members: Member[];
  canDelete: boolean;
  readOnly: boolean;
  onSubmit: (values: TaskFormValues) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const form = useForm<TaskFormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (open) {
      form.reset({
        title: task?.title ?? '',
        status: task?.status ?? defaultStatus,
        assigneeId: task?.assignee?.id ?? '',
        dueDate: task?.dueDate ?? '',
      });
    }
  }, [open, task, defaultStatus, form]);

  const { errors, isSubmitting } = form.formState;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={task ? 'Edit task' : 'New task'}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4" noValidate>
          <fieldset disabled={readOnly} className="grid gap-4">
            <Field label="Title" htmlFor="task-title" error={errors.title?.message}>
              <Input id="task-title" autoFocus {...form.register('title')} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" htmlFor="task-status">
                <NativeSelect id="task-status" {...form.register('status')}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Due date" htmlFor="task-due">
                <Input id="task-due" type="date" {...form.register('dueDate')} />
              </Field>
            </div>
            <Field label="Assignee" htmlFor="task-assignee">
              <NativeSelect id="task-assignee" {...form.register('assigneeId')}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </fieldset>
          <div className="flex items-center justify-between gap-2 pt-1">
            {task && canDelete && !readOnly ? (
              <ConfirmDialog
                title="Delete this task?"
                description="This cannot be undone."
                confirmLabel="Delete task"
                onConfirm={onDelete}
                trigger={
                  <Button type="button" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 aria-hidden /> Delete
                  </Button>
                }
              />
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {readOnly ? 'Close' : 'Cancel'}
              </Button>
              {!readOnly && (
                <Button type="submit" loading={isSubmitting}>
                  {task ? 'Save' : 'Add task'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
