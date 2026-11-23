# Informe de incidencias · Gestor de tareas

**Estudiante:** Facundo Esquivel  
**Fecha:** 9 de noviembre de 2026  
**Proyecto / rama Git:** main  
**Entorno (Expo SDK, Android, dispositivo):** Expo SDK 53 (según `package.json` actual: expo ~53.0.27, React Native 0.79.6, React 19.0.0), Node.js 24, [COMPLETAR: dispositivo/emulador Android usado]  

## Resumen ejecutivo
Se realizó una auditoría técnica y sesión de debugging sobre la aplicación *Gestor de tareas*. Durante la exploración técnica y ejecución de la suite de pruebas automatizadas con Jest, se detectaron 6 defectos (4 principales y 2 adicionales) relacionados con validación de entradas, reactividad del estado en React, sincronización de filtros y manejo de errores asíncronos. Todas las incidencias fueron analizadas hasta su causa raíz en el código y corregidas mediante cambios mínimos e inmutables; la suite de pruebas unitarias y el chequeo de tipos (TypeScript) pasan. [COMPLETAR: indicar cuáles incidencias se reprodujeron en el dispositivo antes de corregir y con qué evidencia.]

> **Nota:** las partes marcadas `[COMPLETAR]` requieren evidencia real (capturas, breakpoints, pruebas en el dispositivo) que todavía no se obtuvo.

---

## Incidencia 1
- **Título de incidencia:** Fallo de reactividad al filtrar tareas por texto en tiempo real.
- **Pasos para reproducir:**
  1. Abrir la aplicación con la lista inicial de tareas.
  2. Escribir cualquier término en el campo «Buscar por nombre...».
  3. Observar la lista de tareas.
- **Esperado / observado:**
  * *Esperado:* La lista debe actualizarse inmediatamente mostrando solo las tareas que coincidan con el término ingresado.
  * *Observado:* La lista no cambia mientras se escribe; solo se actualiza si se conmuta entre pestañas de estado (Pendientes/Completadas/Todas).
- **Herramienta usada (DevTools / consola / test):** [COMPLETAR: captura real de Components/Console de React Native DevTools mostrando `query` cambiando sin que se recalcule `visibleTasks`.]
- **Hipótesis y evidencia:** El hook `useMemo` que computa `visibleTasks` no tiene `query` en su lista de dependencias, evitando que el cálculo se vuelva a disparar al cambiar el estado del input.
- **Archivo y función involucrada:** `app/index.tsx` -> `visibleTasks = useMemo(...)`
- **Causa raíz:** Dependencias incompletas en `useMemo`: estaba configurado como `[tasks, status]`, omitiendo la variable de estado `query`.
- **Corrección aplicada:** Se agregó `query` al array de dependencias: `useMemo(() => filterTasks(tasks, query, status), [tasks, query, status])`.
- **Prueba de regresión:** Escribir en el buscador filtra instantáneamente la lista de tareas.
- **Estado:** Corregido

---

## Incidencia 2
- **Título de incidencia:** Búsqueda sensible a mayúsculas/minúsculas y no tolerante a espacios en blanco.
- **Pasos para reproducir:**
  1. Ejecutar `npm test` en la suite `taskFilters.test.ts`.
  2. Alternativamente, buscar en la app el término en mayúsculas `VALIDAR` o con espacios `  login  `.
- **Esperado / observado:**
  * *Esperado:* Encontrar la tarea "Validar login" independientemente de mayúsculas o espacios accidentales al inicio/final.
  * *Observado:* La búsqueda devuelve 0 resultados y los tests unitarios fallan con `Expected length: 1, Received length: 0`.
- **Herramienta usada (DevTools / consola / test):** Jest (`npm test`).
- **Hipótesis y evidencia:** La función de filtrado utiliza `String.prototype.includes` de forma directa y estricta sin normalizar cadenas.
- **Archivo y función involucrada:** `src/utils/taskFilters.ts` -> función `filterTasks`
- **Causa raíz:** `task.title.includes(query)` evalúa diferencias de casing y no descarta espacios superfluos.
- **Corrección aplicada:** Se normalizó la consulta con `.trim().toLowerCase()` y el título con `.toLowerCase()` antes de invocar `includes`.
- **Prueba de regresión:** Ejecución de `npm test` superando `busca sin distinguir entre minúsculas y mayúsculas` e `ignora espacios antes y después de la búsqueda`.
- **Estado:** Corregido

---

## Incidencia 3
- **Título de incidencia:** La interfaz no responde al marcar o desmarcar una tarea como completada.
- **Pasos para reproducir:**
  1. Hacer clic o presionar sobre el botón de estado/checkbox de cualquier tarjeta de tarea.
  2. Observar el contador superior y el estado visual de la tarjeta.
- **Esperado / observado:**
  * *Esperado:* La tarjeta debe reflejar el cambio de estado (tachado/estilo completado) y los contadores de "COMPLETADAS" y "PENDIENTES" deben recalcularse.
  * *Observado:* La interfaz no realiza ningún cambio visible.
- **Herramienta usada (DevTools / consola / test):** [COMPLETAR: breakpoint o `console.log` real en `toggleTask` mostrando que `tasks` conserva la misma referencia.]
- **Hipótesis y evidencia:** Se está mutando el estado directamente, violando el principio de inmutabilidad en React y evitando que el reconciliador detecte un cambio de referencia en el arreglo.
- **Archivo y función involucrada:** `app/index.tsx` -> función `toggleTask`
- **Causa raíz:** Se mutaba la propiedad del objeto (`found.completed = !found.completed`) y se llamaba a `setTasks(tasks)` pasando la misma referencia del array original. `Object.is(prev, next)` resulta verdadero, omitiendo el re-render.
- **Corrección aplicada:** Se implementó una actualización inmutable utilizando `setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t))`.
- **Prueba de regresión:** Al tocar una tarea, el estilo se actualiza de inmediato y los contadores en la cabecera incrementan/decrementan correctamente.
- **Estado:** Corregido

---

## Incidencia 4
- **Título de incidencia:** Bloqueo permanente en estado de carga (spinner infinito) al simular error de API.
- **Pasos para reproducir:**
  1. Presionar el botón «⚠ Simular error API».
  2. Esperar la respuesta del servicio simulado (700 ms).
- **Esperado / observado:**
  * *Esperado:* Debe mostrarse el mensaje de alerta de error y desaparecer el indicador de carga (`ActivityIndicator`).
  * *Observado:* Aparece el mensaje de error pero el spinner de carga permanece girando indefinidamente y oculta la lista de tareas.
- **Herramienta usada (DevTools / consola / test):** [COMPLETAR: captura real de la consola con el error `HTTP 503` y del estado `loading` en Components.]
- **Hipótesis y evidencia:** El reseteo del flag `loading` solo se efectúa en la rama exitosa de la promesa.
- **Archivo y función involucrada:** `app/index.tsx` -> función `loadTasks`
- **Causa raíz:** La sentencia `setLoading(false)` se encontraba exclusivamente al final del bloque `try`. Cuando `fetchTasks` lanza una excepción, el flujo salta al bloque `catch`, dejando `loading === true`.
- **Corrección aplicada:** Se encapsuló la finalización del estado de carga dentro de una cláusula `finally { setLoading(false); }`.
- **Prueba de regresión:** Al simular error, se visualiza el banner rojo de error y el indicador de carga se oculta inmediatamente.
- **Estado:** Corregido

---

## Otras incidencias (opcional)

### Incidencia 5: Aceptación de tareas vacías compuestas solo por espacios
* **Archivo:** `src/utils/taskValidation.ts` -> `isValidTaskTitle`
* **Causa raíz:** Se evaluaba `title.length > 0`, permitiendo cadenas como `"   "`.
* **Solución:** Se corrigió a `title.trim().length > 0`.
* **Evidencia:** Test `taskValidation.test.ts` pasa exitosamente.

### Incidencia 6: Estado de expansión desfasado al cambiar filtros
* **Archivo:** `app/index.tsx` -> `FlatList.keyExtractor`
* **Causa raíz:** Usaba el índice numérico `String(index)`. Al filtrar, el componente en la posición 0 retenía el estado interno (`expanded`) del elemento que ocupaba esa posición antes del filtro.
* **Solución:** Se modificó a `keyExtractor={(item) => item.id}` garantizando identidad estable por elemento.

---

## Pruebas
| Prueba | Antes | Después | Evidencia |
|---|---|---|---|
| **Búsqueda (case-insensitive & trim)** | ❌ Falló (0 resultados encontrados) | ✅ Pasó (1 resultado encontrado) | `taskFilters.test.ts` pasa en Jest |
| **Validación (títulos con espacios)** | ❌ Falló (retornaba `true`) | ✅ Pasó (retorna `false`) | `taskValidation.test.ts` pasa en Jest |
| **Actualización de estado (`toggleTask`)** | ❌ Sin re-render en UI (según el análisis del código) | [COMPLETAR tras probarlo en el celular] | [COMPLETAR: captura / matriz manual caso C] |
| **Error de servicio (`finally`)** | ❌ Spinner infinito (según el análisis del código) | [COMPLETAR tras probarlo en el celular] | [COMPLETAR: captura / matriz manual caso D] |

---

## Conclusión y control de cambios
- **Commit final (hash):** [Ingresar hash del commit generado con `git rev-parse --short HEAD`]
- **Mensaje del commit:** `fix: resolve task filtering, validation, reactivity, and error handling bugs`
- **Qué aprendí y cómo lo aplicaría a mi app final:**
  1. **Inmutabilidad en React:** Comprender a fondo que React compara referencias de objetos antes de disparar re-renders. Modificar objetos o arrays existentes in-place es una fuente crítica de bugs silenciosos.
  2. **Ciclo de vida en operaciones asíncronas:** Emplear siempre `finally` para banderas de carga (`loading`) asegura que la UI no quede bloqueada ante caídas de red o errores del servidor.
  3. **Identificadores estables en listas:** Nunca usar índices de arreglo como `key` en listas dinámicas o filtrables para prevenir bugs de retención de estado en componentes hijos.
