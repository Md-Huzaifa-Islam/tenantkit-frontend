'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CalendarDays, Plus } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { TASK_STATUSES, type TaskStatus } from '@/lib/shared';
import type { Task } from '@/lib/types';
import { cn, formatDay } from '@/lib/utils';
import { STATUS_LABEL } from './task-dialog';

export type Columns = Record<TaskStatus, Task[]>;

export function toColumns(tasks: Task[]): Columns {
  const cols: Columns = { TODO: [], DOING: [], DONE: [] };
  for (const t of [...tasks].sort((a, b) => a.position - b.position)) cols[t.status].push(t);
  return cols;
}

const DOT: Record<TaskStatus, string> = { TODO: 'bg-muted-foreground', DOING: 'bg-warning', DONE: 'bg-success' };

function isOverdue(t: Task) {
  return t.status !== 'DONE' && t.dueDate !== null && t.dueDate < new Date().toISOString().slice(0, 10);
}

function TaskCard({ task, dragging, onOpen }: { task: Task; dragging?: boolean; onOpen?: () => void }) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card p-3 text-left shadow-xs transition-shadow hover:shadow-sm',
        dragging && 'rotate-1 shadow-lg ring-2 ring-primary/40',
      )}
    >
      <button type="button" onClick={onOpen} className="w-full text-left text-sm font-medium leading-snug focus-visible:outline-none">
        {task.title}
      </button>
      <div className="mt-2.5 flex items-center justify-between gap-2">
        {task.dueDate ? (
          <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', isOverdue(task) && 'font-medium text-destructive')}>
            <CalendarDays className="size-3.5" aria-hidden />
            <span className="sr-only">{isOverdue(task) ? 'Overdue, due' : 'Due'}</span>
            {formatDay(task.dueDate)}
          </span>
        ) : (
          <span />
        )}
        {task.assignee && (
          <span title={task.assignee.name}>
            <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} className="size-6 text-[10px]" />
            <span className="sr-only">Assigned to {task.assignee.name}</span>
          </span>
        )}
      </div>
    </div>
  );
}

function SortableTask({ task, onOpen, disabled }: { task: Task; onOpen: () => void; disabled: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
      aria-roledescription="Draggable task"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !isDragging) onOpen();
        listeners?.onKeyDown?.(e);
      }}
    >
      <TaskCard task={task} onOpen={onOpen} />
    </li>
  );
}

function Column({ status, tasks, onAdd, onOpen, canAdd, disabled }: { status: TaskStatus; tasks: Task[]; onAdd: () => void; onOpen: (t: Task) => void; canAdd: boolean; disabled: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section aria-label={STATUS_LABEL[status]} className={cn('flex min-w-[17rem] flex-1 flex-col rounded-xl bg-muted/60 p-2.5', isOver && 'ring-2 ring-primary/30')}>
      <header className="mb-2.5 flex items-center justify-between px-1">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className={cn('size-2 rounded-full', DOT[status])} aria-hidden />
          {STATUS_LABEL[status]}
          <span className="rounded-full bg-background px-1.5 text-xs font-medium text-muted-foreground">{tasks.length}</span>
        </h2>
        {canAdd && (
          <Button variant="ghost" size="icon" className="size-7" onClick={onAdd} aria-label={`Add task to ${STATUS_LABEL[status]}`}>
            <Plus aria-hidden />
          </Button>
        )}
      </header>
      <SortableContext id={status} items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-24 flex-1 flex-col gap-2">
          {tasks.map((t) => (
            <SortableTask key={t.id} task={t} onOpen={() => onOpen(t)} disabled={disabled} />
          ))}
          {tasks.length === 0 && (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
              Drop tasks here
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}

/**
 * Kanban board. Drags update local state immediately; on drop the affected columns are
 * sent to the API. If the server refuses (e.g. a member moving someone else's task
 * across columns), `onPersist` rejects and the board snaps back to the server state.
 */
export function Board({
  tasks,
  canAdd,
  readOnly,
  onAdd,
  onOpen,
  onPersist,
}: {
  tasks: Task[];
  canAdd: boolean;
  readOnly: boolean;
  onAdd: (status: TaskStatus) => void;
  onOpen: (task: Task) => void;
  onPersist: (columns: Array<{ status: TaskStatus; taskIds: string[] }>, next: Columns) => Promise<void>;
}) {
  const serverColumns = useMemo(() => toColumns(tasks), [tasks]);
  const [columns, setColumns] = useState<Columns>(serverColumns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const origin = useRef<TaskStatus | null>(null);
  useEffect(() => setColumns(serverColumns), [serverColumns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const findColumn = (id: string): TaskStatus | null => {
    if ((TASK_STATUSES as readonly string[]).includes(id)) return id as TaskStatus;
    return TASK_STATUSES.find((s) => columns[s].some((t) => t.id === id)) ?? null;
  };

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
    origin.current = findColumn(String(e.active.id));
  }

  function onDragOver(e: DragOverEvent) {
    const from = findColumn(String(e.active.id));
    const to = e.over ? findColumn(String(e.over.id)) : null;
    if (!from || !to || from === to) return;
    setColumns((prev) => {
      const moving = prev[from].find((t) => t.id === e.active.id)!;
      const overIndex = prev[to].findIndex((t) => t.id === e.over!.id);
      const insertAt = overIndex >= 0 ? overIndex : prev[to].length;
      const target = [...prev[to]];
      target.splice(insertAt, 0, { ...moving, status: to });
      return { ...prev, [from]: prev[from].filter((t) => t.id !== moving.id), [to]: target };
    });
  }

  async function onDragEnd(e: DragEndEvent) {
    const startedIn = origin.current;
    setActiveId(null);
    origin.current = null;
    const column = findColumn(String(e.active.id));
    if (!column || !e.over || !startedIn) return setColumns(serverColumns);

    let next = columns;
    const oldIndex = columns[column].findIndex((t) => t.id === e.active.id);
    const newIndex = columns[column].findIndex((t) => t.id === e.over!.id);
    if (newIndex >= 0 && oldIndex !== newIndex) {
      next = { ...columns, [column]: arrayMove(columns[column], oldIndex, newIndex) };
      setColumns(next);
    }
    const affected = [...new Set([startedIn, column])];
    const unchanged = affected.every(
      (s) => next[s].map((t) => t.id).join() === serverColumns[s].map((t) => t.id).join(),
    );
    if (unchanged) return;
    try {
      await onPersist(affected.map((s) => ({ status: s, taskIds: next[s].map((t) => t.id) })), next);
    } catch {
      setColumns(serverColumns);
    }
  }

  const active = activeId ? TASK_STATUSES.flatMap((s) => columns[s]).find((t) => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setColumns(serverColumns);
      }}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'Press space or enter to pick up a task. Use the arrow keys to move it, space to drop, escape to cancel.',
        },
      }}
    >
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        {TASK_STATUSES.map((s) => (
          <Column key={s} status={s} tasks={columns[s]} canAdd={canAdd} disabled={readOnly} onAdd={() => onAdd(s)} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay>{active ? <TaskCard task={active} dragging /> : null}</DragOverlay>
    </DndContext>
  );
}
