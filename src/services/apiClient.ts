import { Platform } from 'react-native';
import { API_URL, ANDROID_EMULATOR_URL, REQUEST_TIMEOUT_MS } from '../config/api';
import { tokenStorage } from './tokenStorage';
import type { Task, TaskPriority } from '../types/task';

export type BackendTaskStatus = 'pendiente' | 'resuelta';

export type BackendTask = {
  id: string | number;
  user_id?: string | number;
  title: string;
  status?: BackendTaskStatus;
  created_at?: string;
  // Campos opcionales si el backend o el mock los incluyen
  description?: string | null;
  priority?: TaskPriority;
  completed?: boolean;
  is_archived?: boolean;
  archived?: boolean;
};

/**
 * Convierte una tarea del contrato del backend (`status: 'pendiente' | 'resuelta'`)
 * al modelo interno de la app móvil (`completed: boolean`, `archived?: boolean`).
 */
export function mapBackendTaskToTask(raw: BackendTask): Task {
  const mapped: Task = {
    id: String(raw.id),
    title: String(raw.title ?? ''),
    description: raw.description ?? '',
    priority: raw.priority ?? 'media',
    completed: typeof raw.completed === 'boolean' ? raw.completed : raw.status === 'resuelta',
  };
  if (typeof raw.is_archived === 'boolean') {
    mapped.archived = raw.is_archived;
  } else if (typeof raw.archived === 'boolean') {
    mapped.archived = raw.archived;
  }
  return mapped;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Sesión expirada o credenciales inválidas (HTTP 401)') {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor. Verificá tu red.') {
    super(message);
    this.name = 'NetworkError';
  }
}

type OnUnauthorizedCallback = () => void;
let unauthorizedListener: OnUnauthorizedCallback | null = null;

export function setOnUnauthorizedListener(callback: OnUnauthorizedCallback | null) {
  unauthorizedListener = callback;
}

// Semilla mock respetando exactamente el esquema de la DB del backend
let localMockTasks: BackendTask[] = [
  {
    id: 't01',
    user_id: 'usr-facundo',
    title: 'Validar login',
    status: 'pendiente',
    description: 'Verificar que el usuario pueda autenticarse con JWT y SecureStore.',
    priority: 'alta',
    created_at: new Date().toISOString(),
  },
  {
    id: 't02',
    user_id: 'usr-facundo',
    title: 'Corregir navegación',
    status: 'pendiente',
    description: 'Organizar rutas en Expo Router y garantizar navegación protegida.',
    priority: 'media',
    created_at: new Date().toISOString(),
  },
  {
    id: 't03',
    user_id: 'usr-facundo',
    title: 'Auditar accesibilidad',
    status: 'resuelta',
    description: 'Comprobar tamaños táctiles >= 48dp y labels para lectores de pantalla.',
    priority: 'baja',
    created_at: new Date().toISOString(),
  },
  {
    id: 't04',
    user_id: 'usr-facundo',
    title: 'Compilar APK final',
    status: 'pendiente',
    description: 'Generar build standalone con EAS Build perfil preview.',
    priority: 'alta',
    created_at: new Date().toISOString(),
  },
];

let resolvedBaseUrl = API_URL;

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Cliente HTTP centralizado con token Bearer, timeouts y traducción tipada de errores.
 */
export async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  useMockFallback = true,
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (process.env.EXPO_PUBLIC_USE_MOCK === 'true') {
    return handleMockFallback<T>(endpoint, options);
  }

  const token = await tokenStorage.getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const method = (options.method || 'GET').toUpperCase();
  const startMs = Date.now();
  let url = `${resolvedBaseUrl}${normalizedEndpoint}`;

  try {
    let response: Response;
    try {
      response = await fetchWithTimeout(url, { ...options, headers }, REQUEST_TIMEOUT_MS);
    } catch (primaryError) {
      // Si estamos en emulador Android y el firewall bloquea la IP LAN, reintentar por 10.0.2.2
      const canTryEmulatorLoopback =
        Platform.OS === 'android' &&
        !process.env.EXPO_PUBLIC_API_URL?.trim() &&
        resolvedBaseUrl !== ANDROID_EMULATOR_URL;

      if (!canTryEmulatorLoopback) {
        throw primaryError;
      }

      const fallbackUrl = `${ANDROID_EMULATOR_URL}${normalizedEndpoint}`;
      response = await fetchWithTimeout(fallbackUrl, { ...options, headers }, 3000);
      resolvedBaseUrl = ANDROID_EMULATOR_URL;
      url = fallbackUrl;
    }

    if (response.headers.get('x-backend-offline') === '1') {
      throw new NetworkError();
    }

    if (process.env.NODE_ENV !== 'test') {
      const elapsed = Date.now() - startMs;
      console.info(`[apiClient] ${method} ${url} -> ${response.status} (${elapsed}ms)`);
    }

    if (response.status === 401) {
      await tokenStorage.deleteToken();
      unauthorizedListener?.();
      throw new UnauthorizedError();
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: unknown;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = errorText;
      }
      throw new ApiError(
        `Error del servidor (HTTP ${response.status})`,
        response.status,
        parsedError,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ApiError) {
      throw error;
    }

    // Si falló por red o el backend está apagado, y se permite mock contractual:
    if (useMockFallback) {
      console.warn(`[apiClient] Backend offline (${url}). Conmutando a mock contractual.`);
      return handleMockFallback<T>(endpoint, options);
    }

    throw new NetworkError();
  }
}

/** Adaptador mock contractual alineado con /tasks/* y /api/* */
async function handleMockFallback<T>(endpoint: string, options: RequestInit): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  const method = (options.method || 'GET').toUpperCase();
  const cleanEndpoint = endpoint.split('?')[0].replace(/\/+$/, '') || '/';

  // POST /api/auth/login o /auth/login
  if (cleanEndpoint.endsWith('/auth/login') && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (!body.email || !body.password) {
      throw new ApiError('Faltan credenciales', 400);
    }
    return {
      token: 'jwt_mock_token_facundo_esquivel_2026',
      user: {
        id: 'usr-facundo',
        email: body.email,
      },
    } as unknown as T;
  }

  // POST /api/auth/register o /auth/register
  if (cleanEndpoint.endsWith('/auth/register') && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    if (!body.email || !body.password) {
      throw new ApiError('Email y contraseña requeridos', 400);
    }
    return {
      token: 'jwt_mock_token_facundo_esquivel_2026',
      user: {
        id: 'usr-facundo',
        email: body.email,
      },
    } as unknown as T;
  }

  // GET /tasks/ o /api/tasks
  if ((cleanEndpoint === '/tasks' || cleanEndpoint.endsWith('/api/tasks')) && method === 'GET') {
    const includeArchived =
      !endpoint.includes('include_archived=') || endpoint.includes('include_archived=true');
    const list = includeArchived
      ? localMockTasks
      : localMockTasks.filter((t) => !t.is_archived);
    return [...list] as unknown as T;
  }

  // POST /tasks/ o /api/tasks
  if ((cleanEndpoint === '/tasks' || cleanEndpoint.endsWith('/api/tasks')) && method === 'POST') {
    const body = options.body ? JSON.parse(options.body as string) : {};
    const isCompleted = Boolean(body.completed);
    const newTask: BackendTask = {
      id: `task-${Date.now()}`,
      user_id: 'usr-facundo',
      title: body.title || 'Nueva tarea',
      description: body.description ?? '',
      priority: body.priority || 'media',
      completed: isCompleted,
      is_archived: false,
      status: isCompleted ? 'resuelta' : 'pendiente',
      created_at: new Date().toISOString(),
    };
    localMockTasks = [newTask, ...localMockTasks];
    return newTask as unknown as T;
  }

  // POST /api/tasks/archive-completed
  if (cleanEndpoint.endsWith('/tasks/archive-completed') && method === 'POST') {
    let archivedCount = 0;
    localMockTasks = localMockTasks.map((t): BackendTask => {
      const isDone = typeof t.completed === 'boolean' ? t.completed : t.status === 'resuelta';
      if (isDone && !t.is_archived) {
        archivedCount += 1;
        return { ...t, is_archived: true };
      }
      return t;
    });
    return {
      archived_count: archivedCount,
      message: `Se archivaron ${archivedCount} tareas completadas`,
    } as unknown as T;
  }

  // PATCH /api/tasks/:id/status
  const statusMatch = cleanEndpoint.match(/\/(?:api\/)?tasks\/([^/]+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const id = statusMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    const nextStatus: BackendTaskStatus = body.status === 'resuelta' ? 'resuelta' : 'pendiente';
    let foundTask: BackendTask | null = null;
    localMockTasks = localMockTasks.map((t): BackendTask => {
      if (String(t.id) === id) {
        const updated: BackendTask = { ...t, status: nextStatus, completed: nextStatus === 'resuelta' };
        foundTask = updated;
        return updated;
      }
      return t;
    });
    if (!foundTask) throw new ApiError('Tarea no encontrada', 404);
    return foundTask as unknown as T;
  }

  // PATCH /api/tasks/:id/archive y /unarchive
  const archiveMatch = cleanEndpoint.match(/\/(?:api\/)?tasks\/([^/]+)\/(archive|unarchive)$/);
  if (archiveMatch && method === 'PATCH') {
    const [, id, action] = archiveMatch;
    const nextArchived = action === 'archive';
    let foundTask: BackendTask | null = null;
    localMockTasks = localMockTasks.map((t): BackendTask => {
      if (String(t.id) === id) {
        const updated: BackendTask = { ...t, is_archived: nextArchived };
        foundTask = updated;
        return updated;
      }
      return t;
    });
    if (!foundTask) throw new ApiError('Tarea no encontrada', 404);
    return foundTask as unknown as T;
  }

  // GET, PUT y DELETE sobre /tasks/:id o /api/tasks/:id
  const itemMatch = cleanEndpoint.match(/\/(?:api\/)?tasks\/([^/]+)$/);
  if (itemMatch && method === 'GET') {
    const id = itemMatch[1];
    const found = localMockTasks.find((t) => String(t.id) === id);
    if (!found) throw new ApiError('Tarea no encontrada', 404);
    return { ...found } as unknown as T;
  }

  if (itemMatch && method === 'PUT') {
    const id = itemMatch[1];
    const body = options.body ? JSON.parse(options.body as string) : {};
    let foundTask: BackendTask | null = null;
    localMockTasks = localMockTasks.map((t): BackendTask => {
      if (String(t.id) === id) {
        const updated: BackendTask = {
          ...t,
          ...(body.title !== undefined ? { title: String(body.title).trim() } : {}),
          ...(body.description !== undefined ? { description: String(body.description ?? '').trim() } : {}),
          ...(body.priority !== undefined ? { priority: body.priority } : {}),
          ...(typeof body.completed === 'boolean'
            ? {
                completed: body.completed,
                status: body.completed ? 'resuelta' : 'pendiente',
              }
            : {}),
        };
        foundTask = updated;
        return updated;
      }
      return t;
    });
    if (!foundTask) throw new ApiError('Tarea no encontrada', 404);
    return foundTask as unknown as T;
  }

  if (itemMatch && method === 'DELETE') {
    const id = itemMatch[1];
    localMockTasks = localMockTasks.filter((t) => String(t.id) !== id);
    return { success: true } as unknown as T;
  }

  return {} as T;
}
