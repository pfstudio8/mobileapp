import {
  request,
  setOnUnauthorizedListener,
  mapBackendTaskToTask,
  type BackendTask,
} from '../src/services/apiClient';
import { tokenStorage } from '../src/services/tokenStorage';

describe('apiClient (Contrato /api/auth/* y /api/tasks/*)', () => {
  beforeEach(async () => {
    await tokenStorage.deleteToken();
    setOnUnauthorizedListener(null);
  });

  it('mapea correctamente status "resuelta" y "pendiente" del backend a completed boolean', () => {
    const resuelta = mapBackendTaskToTask({
      id: 10,
      title: 'Tarea lista',
      status: 'resuelta',
    });
    const pendiente = mapBackendTaskToTask({
      id: 11,
      title: 'Tarea pendiente',
      status: 'pendiente',
    });

    expect(resuelta.id).toBe('10');
    expect(resuelta.completed).toBe(true);
    expect(pendiente.id).toBe('11');
    expect(pendiente.completed).toBe(false);
  });

  it('obtiene tareas desde GET /api/tasks con formato status pendiente/resuelta', async () => {
    const tasks = await request<BackendTask[]>('/api/tasks');
    expect(Array.isArray(tasks)).toBe(true);
    expect(tasks.length).toBeGreaterThan(0);
    expect(['pendiente', 'resuelta']).toContain(tasks[0].status);
  });

  it('autentica en POST /api/auth/login y devuelve JWT', async () => {
    const response = await request<{ token: string; user: { email: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'usuario@email.com', password: 'mi_password' }),
    });

    expect(response.token).toBeTruthy();
    expect(response.user.email).toBe('usuario@email.com');
  });

  it('registra en POST /api/auth/register solo con email y password', async () => {
    const response = await request<{ token: string; user: { email: string } }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email: 'nuevo@email.com', password: 'mi_password' }),
    });

    expect(response.token).toBeTruthy();
    expect(response.user.email).toBe('nuevo@email.com');
  });

  it('crea con POST /api/tasks, actualiza estado con PATCH /api/tasks/:id/status y elimina con DELETE', async () => {
    const created = await request<BackendTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Comprar materiales de oficina' }),
    });
    expect(created.id).toBeTruthy();
    expect(created.status).toBe('pendiente');

    const updated = await request<BackendTask>(`/api/tasks/${created.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resuelta' }),
    });
    expect(updated.status).toBe('resuelta');

    const deleted = await request<{ success: boolean }>(`/api/tasks/${created.id}`, {
      method: 'DELETE',
    });
    expect(deleted.success).toBe(true);
  });

  it('edita con PUT /api/tasks/:id, archiva/desarchiva y archiva completadas en lote', async () => {
    const created = await request<BackendTask>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ title: 'Tarea inicial', description: 'Nota', priority: 'baja' }),
    });

    const edited = await request<BackendTask>(`/api/tasks/${created.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: 'Tarea editada', description: 'Nota actualizada', priority: 'alta' }),
    });
    expect(edited.title).toBe('Tarea editada');
    expect(edited.priority).toBe('alta');

    const archived = await request<BackendTask>(`/api/tasks/${created.id}/archive`, {
      method: 'PATCH',
    });
    expect(archived.is_archived).toBe(true);

    const restored = await request<BackendTask>(`/api/tasks/${created.id}/unarchive`, {
      method: 'PATCH',
    });
    expect(restored.is_archived).toBe(false);

    await request<BackendTask>(`/api/tasks/${created.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'resuelta' }),
    });

    const batch = await request<{ archived_count: number }>('/api/tasks/archive-completed', {
      method: 'POST',
    });
    expect(batch.archived_count).toBeGreaterThanOrEqual(1);
  });

  it('soporta el contrato FastAPI /tasks/ con completed boolean y PUT /tasks/:id', async () => {
    const list = await request<BackendTask[]>('/tasks/?skip=0&limit=100');
    expect(Array.isArray(list)).toBe(true);

    const created = await request<BackendTask>('/tasks/', {
      method: 'POST',
      body: JSON.stringify({ title: 'Tarea remota', description: 'FastAPI', completed: false }),
    });
    expect(created.id).toBeTruthy();
    expect(created.completed).toBe(false);

    const toggled = await request<BackendTask>(`/tasks/${created.id}`, {
      method: 'PUT',
      body: JSON.stringify({ title: created.title, description: created.description, completed: true }),
    });
    expect(toggled.completed).toBe(true);

    const deleted = await request<{ success: boolean }>(`/tasks/${created.id}`, {
      method: 'DELETE',
    });
    expect(deleted.success).toBe(true);
  });
});
