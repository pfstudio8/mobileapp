# Informe de incidencias · Gestor de tareas

**Estudiante:** Facundo Caballero Esquivel  
**Fecha:** 23 de noviembre de 2026  
**Proyecto / rama Git:** main  
**Entorno:** Expo SDK 53 (`expo ~53.0.27`, React Native `0.79.6`, React `19.0.0`), Node.js `24.21.0`. Probado en emulador Android Pixel 7 (API 34) y en un celular Android 14 real, con Metro y una APK de prueba generada con EAS Build.

---

## Resumen

Revisé a fondo la app *Gestor de tareas (Taskify)* y encontré **6 errores**: 4 principales y 2 secundarios. Tenían que ver con validar lo que escribe el usuario, con que la pantalla no se actualizaba cuando debía, con filtros que fallaban y con un error de red mal manejado.

Los reproduje uno por uno, busqué de dónde venían en el código y los arreglé con cambios chicos y fáciles de seguir. Ahora pasan los **21 tests (6 suites)**, TypeScript no marca ningún error y probé que todo funcione bien en la APK.

---

## Incidencia 1

**Qué pasaba:** el buscador no filtraba mientras se escribía.

**Cómo reproducirlo:**
1. Abrir la app con la lista de tareas cargada.
2. Escribir algo en «Buscar por nombre...» (por ejemplo `Validar`).
3. Mirar la lista.

**Qué esperaba:** que la lista se actualizara en vivo, mostrando solo las tareas que coinciden.

**Qué pasaba en realidad:** la lista no cambiaba al escribir. Recién se filtraba si se tocaba otra pestaña (Pendientes, Completadas o Todas).

**Cómo lo investigué:** con React Native DevTools y la consola de Metro. El texto buscado sí se guardaba en cada tecla, pero la lista filtrada no se volvía a calcular.

**Causa:** en `app/index.tsx`, el `useMemo` que calcula `visibleTasks` no tenía a `query` (el texto buscado) entre sus dependencias. Entonces React reutilizaba el resultado anterior y no se enteraba de que el texto había cambiado.

**Solución:** agregar `query` a la lista de dependencias.
```typescript
const visibleTasks = useMemo(() => filterTasks(tasks, query, status), [tasks, query, status]);
```

**Cómo lo comprobé:** al escribir, la lista filtra al instante. Está cubierto por el test `TaskManagerScreen.test.tsx` (*caso A: buscar "VALIDAR" encuentra "Validar login"*).

**Estado:** corregido.

---

## Incidencia 2

**Qué pasaba:** la búsqueda distinguía mayúsculas de minúsculas y no ignoraba los espacios de más.

**Cómo reproducirlo:**
1. Correr `npm test` (falla en `taskFilters.test.ts`), o
2. Buscar en la app `VALIDAR` o `  login  ` (con espacios).

**Qué esperaba:** que encontrara "Validar login" sin importar mayúsculas ni espacios al principio o al final.

**Qué pasaba en realidad:** no encontraba nada (0 resultados) y el test fallaba con `Expected length: 1, Received length: 0`.

**Cómo lo investigué:** con Jest (`npm test`).

**Causa:** en `src/utils/taskFilters.ts`, la función `filterTasks` comparaba el texto tal cual lo escribía el usuario. Así, `"  login  "` nunca estaba contenido en `"Validar login"`, y `VALIDAR` tampoco coincidía con `Validar`.

**Solución:** limpiar el texto buscado con `.trim().toLowerCase()` y pasar el título a minúsculas antes de comparar.
```typescript
export function filterTasks(tasks: Task[], query: string, status: TaskStatus): Task[] {
  const cleanQuery = query.trim().toLowerCase();
  return tasks.filter((task) => {
    const matchesStatus =
      status === 'todas' || (status === 'completadas' ? task.completed : !task.completed);
    const matchesQuery = cleanQuery.length === 0 || task.title.toLowerCase().includes(cleanQuery);
    return matchesStatus && matchesQuery;
  });
}
```

**Cómo lo comprobé:** los tests de `taskFilters.test.ts` pasan todos.

**Estado:** corregido.

---

## Incidencia 3

**Qué pasaba:** al marcar o desmarcar una tarea, la pantalla no cambiaba.

**Cómo reproducirlo:**
1. Tocar el checkbox de cualquier tarea.
2. Mirar la tarjeta (tilde y título tachado) y los contadores de arriba.

**Qué esperaba:** que la tarjeta cambiara al instante y que los contadores «COMPLETADAS» y «PENDIENTES» se actualizaran.

**Qué pasaba en realidad:** no se veía ningún cambio.

**Cómo lo investigué:** puse un `console.log(prevTasks === newTasks)` y un breakpoint en `toggleTask`. Confirmé que la lista de tareas seguía siendo exactamente el mismo objeto en memoria.

**Causa:** en `app/index.tsx`, la función `toggleTask` modificaba la tarea directamente (`found.completed = !found.completed`) y después llamaba a `setTasks(tasks)` con el mismo arreglo. React compara por referencia: al ver el mismo arreglo, pensó que no había cambiado nada y no volvió a dibujar la pantalla.

**Solución:** crear un arreglo nuevo con `.map()` en lugar de modificar el original.
```typescript
function toggleTask(id: string) {
  setTasks((previous) =>
    previous.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
  );
}
```

**Cómo lo comprobé:** al tocar el checkbox, el tilde y el progreso cambian al toque. Está cubierto por `TaskManagerScreen.test.tsx` (*caso C: marcar una tarea cambia su estado de inmediato*).

**Estado:** corregido.

---

## Incidencia 4

**Qué pasaba:** al simular un error de la API, el spinner de carga giraba para siempre.

**Cómo reproducirlo:**
1. Tocar el botón «⚠ Simular error API».
2. Esperar la respuesta simulada (700 ms).

**Qué esperaba:** que apareciera el cartel de error (`HTTP 503`) y que el spinner desapareciera.

**Qué pasaba en realidad:** el cartel de error aparecía, pero el spinner seguía girando sin parar y trababa la pantalla.

**Cómo lo investigué:** con React Native DevTools y los logs de consola, donde se veía el error `HTTP 503: servidor temporalmente indisponible`.

**Causa:** en `app/index.tsx`, la función `loadTasks` apagaba el spinner (`setLoading(false)`) solo cuando todo salía bien. Si había un error, el código saltaba al `catch` y nunca llegaba a apagarlo.

**Solución:** mover el `setLoading(false)` a un bloque `finally`, que se ejecuta siempre, haya error o no.
```typescript
async function loadTasks(simulateFailure = false) {
  setLoading(true);
  setError(null);
  try {
    const records = await fetchTasks(simulateFailure);
    setTasks(records);
  } catch (caught) {
    console.error('[taskService] No se cargaron las tareas', caught);
    const message =
      caught instanceof Error && caught.message
        ? caught.message
        : 'No pudimos cargar las tareas. Verificá tu conexión e intentá nuevamente.';
    setError(message);
  } finally {
    setLoading(false);
  }
}
```

**Cómo lo comprobé:** al simular el error, el spinner se va a los 700 ms y queda el cartel con la opción de reintentar. Está cubierto por `TaskManagerScreen.test.tsx` (*caso D: simular error muestra el mensaje y termina la carga*).

**Estado:** corregido.

---

## Otras incidencias corregidas

### Incidencia 5: se podían crear tareas con solo espacios
* **Dónde:** `src/utils/taskValidation.ts` (`isValidTaskTitle`) y `app/index.tsx` (`addTask`).
* **Causa:** el validador solo chequeaba que el texto no estuviera vacío (`title.length > 0`), así que `"   "` pasaba como válido. Además, al guardar no se recortaban los espacios de los costados.
* **Solución:** ahora se valida con `title.trim().length > 0` y se guarda `newTitle.trim()`.
* **Cómo lo comprobé:** tests en `taskValidation.test.ts` y `TaskManagerScreen.test.tsx` (*caso E: crear una tarea con solo espacios se rechaza*), todos en verde.

### Incidencia 6: el detalle abierto "saltaba" a otra tarea al filtrar
* **Dónde:** `app/index.tsx`, en el `keyExtractor` de la `FlatList`.
* **Causa:** se usaba la posición en la lista como identificador (`(_item, index) => String(index)`). Al filtrar, la tarea que quedaba primera heredaba el estado "expandida" de la que estaba antes en esa posición.
* **Solución:** usar el id propio de cada tarea: `keyExtractor={(item) => item.id}`. Así cada tarea mantiene su propio estado.
* **Cómo lo comprobé:** al expandir una tarea y pasar a «Pendientes», el detalle sigue en su tarea y no se mueve a otra.

---

## Antes vs. después

| Caso | Antes | Después | Cómo se verificó |
|---|---|---|---|
| **Búsqueda en vivo** | ❌ La lista no se actualizaba al escribir | ✅ Filtra con cada tecla | `TaskManagerScreen.test.tsx` (caso A) |
| **Mayúsculas y espacios en la búsqueda** | ❌ Fallaba con `Expected: 1, Received: 0` | ✅ Encuentra con `VALIDAR` o `  login  ` | `taskFilters.test.ts` |
| **Título vacío** | ❌ Aceptaba tareas de solo espacios | ✅ Las rechaza y avisa | `taskValidation.test.ts` + caso E |
| **Marcar tarea como hecha** | ❌ La pantalla no cambiaba | ✅ Cambia el check y los contadores al instante | `TaskManagerScreen.test.tsx` (caso C) |
| **Error HTTP 503** | ❌ Spinner infinito que trababa la app | ✅ El spinner se apaga siempre | `TaskManagerScreen.test.tsx` (caso D) |
| **Detalle abierto al filtrar** | ❌ Saltaba a otra tarea | ✅ Se queda en su tarea | Emulador y tests de lista |

---

## Uso responsable de Inteligencia Artificial
*(Requisito del Eje 5 y Sección 7 del programa EDI 2026)*

1. **Herramienta:** asistente de IA Antigravity (Google DeepMind).
2. **Para qué la usé:**
   * Entender las causas de los errores a partir de lo que se veía en la app y de los mensajes de Jest.
   * Comparar formas de actualizar el estado en React sin modificar los datos originales.
   * Mejorar los tests de componentes con React Native Testing Library.
   * Ayuda con el diseño responsive y accesible de la pantalla de login y registro.
3. **Cómo validé lo que propuso:**
   * No acepté ningún cambio sin entenderlo. Revisé cada solución línea por línea, la comparé con la documentación oficial de React Native y Expo SDK 53, y la probé con los tests y en el emulador.
   * Entiendo la diferencia entre el **síntoma** (lo que se ve mal en la pantalla) y la **causa** (qué está mal en el código).

---

## Conclusión

- **Rama:** `main`
- **Commit de referencia:** `d8940b2`
- **Lo que aprendí:**
  1. **No modificar los datos originales:** React compara referencias. Si se cambia un objeto o arreglo "en el lugar", React no se entera y la pantalla no se actualiza. Hay que crear uno nuevo.
  2. **Usar `finally` en las operaciones asíncronas:** garantiza que el spinner y otros estados de carga se limpien siempre, haya error o no.
  3. **Usar ids estables como clave en las listas:** si se usa la posición, al filtrar o reordenar los estados se cruzan entre elementos. El `item.id` evita eso.
