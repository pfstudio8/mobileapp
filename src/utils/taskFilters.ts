import type { Task, TaskStatus } from '../types/task';

export function filterTasks(tasks: Task[], query: string, status: TaskStatus): Task[] {
  const normalizedQuery = query.trim().toLowerCase();

  const byStatus = tasks.filter((task) => {
    const isArchived = Boolean(task.archived);
    if (status === 'archivadas') return isArchived;
    if (isArchived) return false;
    if (status === 'pendientes') return !task.completed;
    if (status === 'completadas') return task.completed;
    return true;
  });

  return byStatus.filter((task) =>
    task.title.toLowerCase().includes(normalizedQuery)
  );
}
