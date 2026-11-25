import type { Task, TaskPriority } from '../types/task';
import {
  request,
  mapBackendTaskToTask,
  type BackendTask,
} from './apiClient';
import { tokenStorage } from './tokenStorage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const TASKS_COLLECTION_ENDPOINT = '/tasks/';
const TASKS_LIST_ENDPOINT = '/tasks/?skip=0&limit=100';

const INITIAL_TASKS: Task[] = [
  { id: 't01', title: 'Validar login', description: 'Comprobar campos vacíos y credenciales incorrectas.', priority: 'alta', completed: false },
  { id: 't02', title: 'Corregir navegación', description: 'Validar el regreso desde el detalle.', priority: 'media', completed: true },
  { id: 't03', title: 'Probar API lenta', description: 'Simular una demora y verificar los indicadores de carga.', priority: 'alta', completed: false },
  { id: 't04', title: 'Generar reporte', description: 'Documentar los fallos detectados y su corrección.', priority: 'baja', completed: false },
  { id: 't05', title: 'Revisar validaciones', description: 'Asegurar el tratamiento de espacios y datos vacíos.', priority: 'media', completed: true },
];

type LocalTaskMeta = {
  priority?: TaskPriority;
  archived?: boolean;
};

// Caché en memoria para conservar campos locales (prioridad/archivado) que el backend público
// (id, title, description, completed) no persiste, y para completar PUT /tasks/{id}.
const taskCache = new Map<string, Task>();
const localTaskMeta = new Map<string, LocalTaskMeta>();

function applyLocalMeta(task: Task): Task {
  const meta = localTaskMeta.get(task.id);
  const merged: Task = {
    ...task,
    ...(meta?.priority !== undefined ? { priority: meta.priority } : {}),
    ...(meta?.archived !== undefined ? { archived: meta.archived } : {}),
  };
  taskCache.set(merged.id, merged);
  return merged;
}

function extractTaskList(payload: unknown): Task[] {
  if (Array.isArray(payload)) {
    return payload.map((item) => applyLocalMeta(mapBackendTaskToTask(item as BackendTask)));
  }
  if (payload && typeof payload === 'object') {
    const obj = payload as { tasks?: unknown; data?: unknown };
    if (Array.isArray(obj.tasks)) {
      return obj.tasks.map((item) => applyLocalMeta(mapBackendTaskToTask(item as BackendTask)));
    }
    if (Array.isArray(obj.data)) {
      return obj.data.map((item) => applyLocalMeta(mapBackendTaskToTask(item as BackendTask)));
    }
  }
  return [];
}

/**
 * Obtiene tareas. Soporta simulación de error (taller) y llamada a /tasks/.
 */
export async function fetchTasks(simulateFailureOrEndpoint: boolean | string = false): Promise<Task[]> {
  if (typeof simulateFailureOrEndpoint === 'boolean') {
    if (simulateFailureOrEndpoint) {
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      throw new Error('HTTP 503: servidor temporalmente indisponible (simulado)');
    }
  } else if (typeof simulateFailureOrEndpoint === 'string' && simulateFailureOrEndpoint) {
    try {
      const token = await tokenStorage.getToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${simulateFailureOrEndpoint.replace(/\/$/, '')}${TASKS_LIST_ENDPOINT}`, {
        headers,
      });
      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status}): no se pudieron cargar las tareas.`);
      }
      const data = await response.json();
      return extractTaskList(data);
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Error en el servidor')) {
        throw error;
      }
      throw new Error('Error de conexión: no pudimos comunicarnos con el servidor. Verificá tu red.');
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    const raw = await request<BackendTask[] | { tasks: BackendTask[] }>(
      TASKS_LIST_ENDPOINT,
      { method: 'GET' },
    );
    return extractTaskList(raw);
  }

  // Fallback determinista para tests unitarios de pantalla
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  return INITIAL_TASKS.map((task) => ({ ...task }));
}

export async function listRemoteTasks(includeArchived = true): Promise<Task[]> {
  const raw = await request<BackendTask[] | { tasks: BackendTask[] }>(TASKS_LIST_ENDPOINT, {
    method: 'GET',
  });
  const list = extractTaskList(raw);
  return includeArchived ? list : list.filter((task) => !task.archived);
}

export async function getRemoteTaskById(id: string): Promise<Task> {
  const raw = await request<BackendTask>(`/tasks/${id}`, {
    method: 'GET',
  });
  return applyLocalMeta(mapBackendTaskToTask(raw));
}

export async function createRemoteTask(
  title: string,
  description = '',
  priority: TaskPriority = 'media',
): Promise<Task> {
  const created = await request<BackendTask>(TASKS_COLLECTION_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify({
      title: title.trim(),
      description: description.trim(),
      completed: false,
    }),
  });
  const mapped = mapBackendTaskToTask(created);
  localTaskMeta.set(mapped.id, { ...localTaskMeta.get(mapped.id), priority });
  return applyLocalMeta(mapped);
}

export async function updateRemoteTask(
  id: string,
  patch: { title?: string; description?: string; priority?: TaskPriority; completed?: boolean },
): Promise<Task> {
  const current = taskCache.get(id) ?? (await getRemoteTaskById(id));
  if (patch.priority !== undefined) {
    localTaskMeta.set(id, { ...localTaskMeta.get(id), priority: patch.priority });
  }

  const nextTitle = (patch.title ?? current.title).trim();
  const nextDescription = (patch.description ?? current.description ?? '').trim();
  const nextCompleted = patch.completed ?? current.completed;

  const updated = await request<BackendTask>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: nextTitle,
      description: nextDescription,
      completed: nextCompleted,
    }),
  });
  return applyLocalMeta(mapBackendTaskToTask(updated));
}

export async function updateRemoteTaskStatus(id: string, completed: boolean): Promise<Task> {
  const current = taskCache.get(id) ?? (await getRemoteTaskById(id));
  const updated = await request<BackendTask>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title: current.title,
      description: current.description ?? '',
      completed,
    }),
  });
  return applyLocalMeta(mapBackendTaskToTask(updated));
}

export async function archiveRemoteTask(id: string): Promise<Task> {
  localTaskMeta.set(id, { ...localTaskMeta.get(id), archived: true });
  const current = taskCache.get(id) ?? (await getRemoteTaskById(id));
  return applyLocalMeta({ ...current, archived: true });
}

export async function unarchiveRemoteTask(id: string): Promise<Task> {
  localTaskMeta.set(id, { ...localTaskMeta.get(id), archived: false });
  const current = taskCache.get(id) ?? (await getRemoteTaskById(id));
  return applyLocalMeta({ ...current, archived: false });
}

export async function archiveCompletedRemoteTasks(): Promise<{ archived_count: number }> {
  let archivedCount = 0;
  for (const [id, task] of taskCache.entries()) {
    if (task.completed && !task.archived) {
      archivedCount += 1;
      localTaskMeta.set(id, { ...localTaskMeta.get(id), archived: true });
      taskCache.set(id, { ...task, archived: true });
    }
  }
  return { archived_count: archivedCount };
}

export async function deleteRemoteTask(id: string): Promise<void> {
  await request(`/tasks/${id}`, {
    method: 'DELETE',
  });
  taskCache.delete(id);
  localTaskMeta.delete(id);
}
