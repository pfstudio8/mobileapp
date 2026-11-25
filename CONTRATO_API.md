# Contrato de Interoperabilidad · Taskify API (EDI 2026)

Este documento especifica el contrato oficial cliente-servidor entre la aplicacion movil React Native (**Taskify**) y el backend REST API en **FastAPI + SQLAlchemy 2.0**.

---

## 1. Configuracion de Entorno y Conectividad

* **Variable de entorno:** `EXPO_PUBLIC_API_URL` (resuelta en `src/config/api.ts`).
  * **Produccion HTTPS:** `https://api.montenegroariel.com.ar`
  * **Desarrollo local (autodeteccion + Proxy Metro):** `EXPO_PUBLIC_API_URL=` vacio. Las peticiones viajan por el servidor de Expo (`:8081`) y `metro.config.js` las redirige a `http://127.0.0.1:8000`.
  * **Web / Localhost directo:** `http://localhost:8000`
* **Formato de datos:** `application/json; charset=utf-8`.
* **Timeout:** 10.000 ms (10 s) mediante `AbortController`.
* **Respaldo offline:** Si `EXPO_PUBLIC_USE_MOCK=true` o el servidor no responde por falla de red, `apiClient` conmuta al adaptador mock contractual con identico esquema JSON.

---

## 2. Estructura de Entidades del Backend

### Modelo `Task` (FastAPI / SQLAlchemy)
| Campo | Tipo | Restricciones | Descripcion |
| :--- | :--- | :--- | :--- |
| `id` | INT | PK, Autoincremental | Identificador unico de la tarea |
| `title` | VARCHAR(100) | NOT NULL | Titulo de la tarea |
| `description` | VARCHAR(255) | NULLABLE | Descripcion o notas adicionales |
| `completed` | BOOLEAN | DEFAULT `false` | Estado de completitud de la tarea |

---

## 3. Especificacion de Endpoints Oficiales de Produccion

El backend publicado en `https://api.montenegroariel.com.ar` expone las siguientes operaciones REST:

### 3.1. Gestion de Tareas (`/tasks/`)

* **`GET /tasks/?skip=0&limit=100`**
  * Descripcion: Obtiene el listado de tareas registradas.
  * Respuesta exitosa: `HTTP 200 OK` con arreglo JSON de `TaskResponse`.

* **`GET /tasks/{task_id}`**
  * Descripcion: Obtiene el detalle de una tarea por su ID numerico.
  * Respuestas: `HTTP 200 OK` o `HTTP 404 Not Found`.

* **`POST /tasks/`**
  * Descripcion: Crea una nueva tarea en el servidor.
  * Body JSON:
    ```json
    {
      "title": "Titulo de la tarea",
      "description": "Detalles opcionales",
      "completed": false
    }
    ```
  * Respuesta exitosa: `HTTP 201 Created` con el objeto creado.

* **`PUT /tasks/{task_id}`**
  * Descripcion: Actualiza los campos de una tarea (incluyendo su estado completada/pendiente).
  * Body JSON:
    ```json
    {
      "title": "Titulo actualizado",
      "description": "Descripcion actualizada",
      "completed": true
    }
    ```
  * Respuesta exitosa: `HTTP 200 OK` con la tarea actualizada.

* **`DELETE /tasks/{task_id}`**
  * Descripcion: Elimina la tarea especificada.
  * Respuesta exitosa: `HTTP 204 No Content`.

---

## 4. Adaptacion y Compatibilidad del Cliente Movil

1. **Compatibilidad Dual:** La aplicacion movil resuelve transparentemente tanto la estructura `/tasks/` del servidor remoto como la ruta `/api/tasks` de backends locales extendidos.
2. **Persistencia Local de Prioridad y Archivado:** Como el modelo base de FastAPI almacena `title`, `description` y `completed`, las propiedades complementarias de la interfaz movil (`priority: 'alta' | 'media' | 'baja'` y `archived: boolean`) son administradas de forma local en `src/services/taskService.ts` sin interrumpir las peticiones remotas.
3. **Autenticacion y Sesion:** Si el backend remoto opera de forma publica sin endpoints `/api/auth/*` activos, `AuthContext.tsx` provee sesion local persistida en `expo-secure-store` para permitir la operacion completa del usuario.
