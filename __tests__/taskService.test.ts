import { fetchTasks } from '../src/services/taskService';

describe('fetchTasks - Manejo de errores de API', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('lanza mensaje claro cuando el servidor responde con error 500', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchTasks('https://api.ejemplo.com')).rejects.toThrow(
      'Error en el servidor (500): no se pudieron cargar las tareas.'
    );
  });

  it('lanza mensaje claro cuando el servidor responde con 404', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    await expect(fetchTasks('https://api.ejemplo.com')).rejects.toThrow(
      'Error en el servidor (404): no se pudieron cargar las tareas.'
    );
  });

  it('lanza mensaje claro de conexión si falla la red', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

    await expect(fetchTasks('https://api.ejemplo.com')).rejects.toThrow(
      'Error de conexión: no pudimos comunicarnos con el servidor. Verificá tu red.'
    );
  });

  it('retorna las tareas correctamente cuando la API responde 200 OK', async () => {
    const mockTasks = [{ id: '1', title: 'Tarea API', description: '', priority: 'alta', completed: false }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockTasks,
    });

    const result = await fetchTasks('https://api.ejemplo.com');
    expect(result).toEqual(mockTasks);
  });
});

