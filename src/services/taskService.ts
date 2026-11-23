import type { Task } from '../types/task';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || '';

const INITIAL_TASKS: Task[] = [
  { id: 't01', title: 'Validar login', description: 'Comprobar campos vacíos y credenciales incorrectas.', priority: 'alta', completed: false },
  { id: 't02', title: 'Corregir navegación', description: 'Validar el regreso desde el detalle.', priority: 'media', completed: true },
  { id: 't03', title: 'Probar API lenta', description: 'Simular una demora y verificar los indicadores de carga.', priority: 'alta', completed: false },
  { id: 't04', title: 'Generar reporte', description: 'Documentar los fallos detectados y su corrección.', priority: 'baja', completed: false },
  { id: 't05', title: 'Revisar validaciones', description: 'Asegurar el tratamiento de espacios y datos vacíos.', priority: 'media', completed: true },
];

export async function fetchTasks(simulateFailureOrEndpoint: boolean | string = false): Promise<Task[]> {
  if (typeof simulateFailureOrEndpoint === 'boolean') {
    if (simulateFailureOrEndpoint) {
      await new Promise<void>((resolve) => setTimeout(resolve, 400));
      throw new Error('HTTP 503: servidor temporalmente indisponible (simulado)');
    }
  } else if (typeof simulateFailureOrEndpoint === 'string' && simulateFailureOrEndpoint) {
    try {
      const response = await fetch(`${simulateFailureOrEndpoint.replace(/\/$/, '')}/tasks`);
      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status}): no se pudieron cargar las tareas.`);
      }
      return (await response.json()) as Task[];
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('Error en el servidor')) {
        throw error;
      }
      throw new Error('Error de conexión: no pudimos comunicarnos con el servidor. Verificá tu red.');
    }
  }

  if (API_URL) {
    return fetchTasks(API_URL);
  }

  // Fallback mock de desarrollo
  await new Promise<void>((resolve) => setTimeout(resolve, 300));
  return INITIAL_TASKS.map((task) => ({ ...task }));
}
