import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableTaskCard } from './SortableTaskCard';
import { KanbanColumnDnd } from './KanbanColumnDnd';
import { KanbanColumnStatic } from './KanbanColumnStatic';
import { useLifeOSStore } from '@/stores/useLifeOSStore';
import { useSyncedStore } from '@/hooks/useSyncedStore';
import { Task } from '@/types/lifeos';

interface DndKanbanBoardProps {
  todoTasks: Task[];
  inProgressTasks: Task[];
  doneTasks: Task[];
  deferredTasks: Task[];
  isCompactView: boolean;
  collapsedColumns: string[];
  maxTasks?: number;
  onToggleCollapse: (column: string) => void;
  onTaskClick: (task: Task) => void;
  onStartPomodoro: (task: Task) => void;
  onToggleComplete: (task: Task) => void;
  dndEnabled?: boolean;
}

type ColumnId = 'todo' | 'in_progress' | 'done' | 'deferred';

export function DndKanbanBoard({
  todoTasks,
  inProgressTasks,
  doneTasks,
  deferredTasks,
  isCompactView,
  collapsedColumns,
  maxTasks = 0,
  onToggleCollapse,
  onTaskClick,
  onStartPomodoro,
  onToggleComplete,
  dndEnabled = true,
}: DndKanbanBoardProps) {
  // Use synced store for operations that need to sync to Supabase
  const { updateTask } = useSyncedStore();
  const reorderTasks = useLifeOSStore((s) => s.reorderTasks);

  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const columns: Record<ColumnId, Task[]> = {
    todo: todoTasks,
    in_progress: inProgressTasks,
    done: doneTasks,
    deferred: deferredTasks,
  };

  const allTasks = useMemo(
    () => [...todoTasks, ...inProgressTasks, ...doneTasks, ...deferredTasks],
    [todoTasks, inProgressTasks, doneTasks, deferredTasks]
  );

  const findColumn = (id: UniqueIdentifier): ColumnId | null => {
    if (id in columns) return id as ColumnId;
    
    for (const [columnId, tasks] of Object.entries(columns)) {
      if (tasks.some(task => task.id === id)) {
        return columnId as ColumnId;
      }
    }
    return null;
  };

  const activeTask = activeId ? allTasks.find(t => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeColumn = findColumn(active.id);
    let overColumn = findColumn(over.id);

    // If over is a column id directly
    if (over.id in columns) {
      overColumn = over.id as ColumnId;
    }

    if (!activeColumn || !overColumn) return;

    const activeTask = allTasks.find(t => t.id === active.id);
    if (!activeTask) return;

    // Moving to different column
    if (activeColumn !== overColumn) {
      const newStatus = overColumn;
      if (newStatus === 'done') {
        updateTask(active.id as string, { status: newStatus, completedAt: new Date().toISOString() });
      } else {
        updateTask(active.id as string, { status: newStatus, completedAt: undefined });
      }
    } else {
      // Reordering within same column
      if (active.id !== over.id && over.id !== activeColumn) {
        reorderTasks(active.id as string, over.id as string, 'after');
      }
    }
  };

  if (!dndEnabled) {
    return (
      <div className="flex-1 min-h-0 h-full overflow-x-auto overflow-y-hidden">
        <div
          className="grid gap-3 h-full min-h-0 transition-all duration-300"
          style={{
            gridTemplateColumns: [
              collapsedColumns.includes('todo') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('in_progress') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('done') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('deferred') ? '3.5rem' : 'minmax(240px, 420px)',
            ].join(' '),
          }}
        >
        <KanbanColumnStatic
          id="todo"
          title="Todo"
          iconType="todo"
          tasks={todoTasks}
          isCollapsed={collapsedColumns.includes('todo')}
          isCompactView={isCompactView}
          maxTasks={maxTasks}
          onToggleCollapse={onToggleCollapse}
          onTaskClick={onTaskClick}
          onStartPomodoro={onStartPomodoro}
          onToggleComplete={onToggleComplete}
        />
        <KanbanColumnStatic
          id="in_progress"
          title="Đang làm"
          iconType="in_progress"
          tasks={inProgressTasks}
          isCollapsed={collapsedColumns.includes('in_progress')}
          isCompactView={isCompactView}
          maxTasks={maxTasks}
          onToggleCollapse={onToggleCollapse}
          onTaskClick={onTaskClick}
          onStartPomodoro={onStartPomodoro}
          onToggleComplete={onToggleComplete}
        />
        <KanbanColumnStatic
          id="done"
          title="Hoàn thành"
          iconType="done"
          tasks={doneTasks}
          isCollapsed={collapsedColumns.includes('done')}
          isCompactView={isCompactView}
          maxTasks={maxTasks}
          onToggleCollapse={onToggleCollapse}
          onTaskClick={onTaskClick}
          onStartPomodoro={onStartPomodoro}
          onToggleComplete={onToggleComplete}
        />
        <KanbanColumnStatic
          id="deferred"
          title="Tạm hoãn"
          iconType="deferred"
          tasks={deferredTasks}
          isCollapsed={collapsedColumns.includes('deferred')}
          isCompactView={isCompactView}
          maxTasks={maxTasks}
          onToggleCollapse={onToggleCollapse}
          onTaskClick={onTaskClick}
          onStartPomodoro={onStartPomodoro}
          onToggleComplete={onToggleComplete}
        />
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto min-h-0 h-full">
        <div
          className="grid gap-3 h-full min-h-0 transition-all duration-300"
          style={{
            gridTemplateColumns: [
              collapsedColumns.includes('todo') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('in_progress') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('done') ? '3.5rem' : 'minmax(240px, 420px)',
              collapsedColumns.includes('deferred') ? '3.5rem' : 'minmax(240px, 420px)',
            ].join(' '),
          }}
        >
          <KanbanColumnDnd
            id="todo"
            title="Todo"
            iconType="todo"
            tasks={todoTasks}
            isCollapsed={collapsedColumns.includes('todo')}
            isCompactView={isCompactView}
            isOver={overId === 'todo'}
            maxTasks={maxTasks}
            onToggleCollapse={onToggleCollapse}
            onTaskClick={onTaskClick}
            onStartPomodoro={onStartPomodoro}
            onToggleComplete={onToggleComplete}
          />
          <KanbanColumnDnd
            id="in_progress"
            title="Đang làm"
            iconType="in_progress"
            tasks={inProgressTasks}
            isCollapsed={collapsedColumns.includes('in_progress')}
            isCompactView={isCompactView}
            isOver={overId === 'in_progress'}
            maxTasks={maxTasks}
            onToggleCollapse={onToggleCollapse}
            onTaskClick={onTaskClick}
            onStartPomodoro={onStartPomodoro}
            onToggleComplete={onToggleComplete}
          />
          <KanbanColumnDnd
            id="done"
            title="Hoàn thành"
            iconType="done"
            tasks={doneTasks}
            isCollapsed={collapsedColumns.includes('done')}
            isCompactView={isCompactView}
            isOver={overId === 'done'}
            maxTasks={maxTasks}
            onToggleCollapse={onToggleCollapse}
            onTaskClick={onTaskClick}
            onStartPomodoro={onStartPomodoro}
            onToggleComplete={onToggleComplete}
          />
          <KanbanColumnDnd
            id="deferred"
            title="Tạm hoãn"
            iconType="deferred"
            tasks={deferredTasks}
            isCollapsed={collapsedColumns.includes('deferred')}
            isCompactView={isCompactView}
            isOver={overId === 'deferred'}
            maxTasks={maxTasks}
            onToggleCollapse={onToggleCollapse}
            onTaskClick={onTaskClick}
            onStartPomodoro={onStartPomodoro}
            onToggleComplete={onToggleComplete}
          />
        </div>
      </div>

      <DragOverlay>
        {activeTask && (
          <SortableTaskCard
            task={activeTask}
            isCompactView={isCompactView}
            isDragOverlay
            onTaskClick={onTaskClick}
            onStartPomodoro={onStartPomodoro}
            onToggleComplete={onToggleComplete}
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
