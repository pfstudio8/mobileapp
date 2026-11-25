# Taskify - Gestor de Tareas Movil

Aplicacion movil desarrollada con **React Native** y **Expo SDK 53**, conectada a un backend REST API en **FastAPI + SQLAlchemy 2.0**. Proyecto correspondiente al espacio curricular EDI (Desarrollo de Software Multiplataforma).

---

## 1. Caracteristicas Principales

- **Gestion completa de tareas (CRUD):** Creacion, edicion, visualizacion de detalles, alternancia de estado (pendiente/resuelta) y eliminacion definitiva.
- **Filtros reactivos:** Busqueda en vivo insensible a mayusculas/espacios y filtrado por pestanas (*Todas*, *Pendientes*, *Completadas*, *Archivadas*).
- **Consumo de API remota y local:** Integracion con backend FastAPI en produccion con HTTPS (`https://api.montenegroariel.com.ar`) y soporte para entorno de desarrollo local.
- **Respaldo offline contractual:** Cliente HTTP centralizado con mecanismo de tolerancia a fallos ante caidas de red o cortes de servidor, simulando el contrato exacto de datos.
- **Arquitectura tipada y testeada:** Implementado íntegramente en TypeScript con tipado estricto y una suite automatizada de 30 pruebas unitarias y de integracion con Jest.

---

## 2. Tecnologias Utilizadas

- **Framework movil:** Expo SDK 53 (`expo ~53.0.27`), React Native `0.79.6`, React `19.0.0`.
- **Ruteo y Navegacion:** Expo Router `~5.1.11` (navegacion basada en sistema de archivos y grupos de rutas `(auth)` y `(app)`).
- **Lenguaje:** TypeScript `~5.8.3`.
- **Testing:** Jest `~29.7.0`, Jest Expo `~53.0.14`, React Native Testing Library `^13.3.0`.
- **Backend compatible:** FastAPI, SQLAlchemy 2.0, Nginx (HTTPS).
- **Compilacion de produccion:** EAS Build (perfiles `preview` para APK standalone y `development`).

---

## 3. Requisitos Previos e Instalacion

1. **Node.js:** Version 20 o superior recomendada (probado en Node.js 24).
2. **Dependencias:**
   ```bash
   npm install --legacy-peer-deps
   ```
   *(Nota: el archivo `.npmrc` ya incluye `legacy-peer-deps=true` para garantizar compatibilidad con React 19).*

---

## 4. Configuracion de Variables de Entorno

Crear un archivo `.env` en la raiz del proyecto a partir de `.env.example`:

```env
# URL base del Backend REST en produccion
EXPO_PUBLIC_API_URL=https://api.montenegroariel.com.ar

# Modo mock contractual (false para consumir la API real)
EXPO_PUBLIC_USE_MOCK=false
```

Si se deja `EXPO_PUBLIC_API_URL` vacio, la app conmuta a la autodeteccion local para desarrollo con emulador o proxy de Metro.

---

## 5. Scripts Disponibles

- **Iniciar entorno de desarrollo:**
  ```bash
  npx expo start -c
  ```
- **Ejecutar pruebas unitarias automatizadas:**
  ```bash
  npm test
  ```
- **Chequeo estatico de tipos TypeScript:**
  ```bash
  npm run typecheck
  ```
- **Diagnostico de dependencias Expo:**
  ```bash
  npm run doctor
  ```
- **Compilacion de APK instalable con EAS Build:**
  ```bash
  npm run build:preview
  ```

---

## 6. Estructura del Proyecto

```text
├── app/                  # Rutas y pantallas de Expo Router
│   ├── (app)/            # Rutas protegidas (index, new, profile, task/[id])
│   ├── (auth)/           # Rutas publicas de acceso (login)
│   └── _layout.tsx       # Layout raiz con proveedores de fuentes y autenticacion
├── src/
│   ├── components/       # Componentes reutilizables (TaskCard, StatusTabs, Typo, etc.)
│   ├── config/           # Resolucion de API y variables de entorno
│   ├── context/          # Contexto global de sesion y usuario (AuthContext)
│   ├── services/         # Cliente HTTP (apiClient), servicio de tareas y almacenamiento
│   ├── types/            # Definiciones de tipos TypeScript
│   └── utils/            # Utilidades de filtrado y validacion
├── __tests__/            # Suites de pruebas automatizadas (30 tests Jest)
├── .env.example          # Plantilla de configuracion de entorno
├── app.json              # Configuracion de Expo y paquete Android
├── eas.json              # Perfiles de compilacion EAS (development, preview, production)
├── INFORME_INCIDENTES.md # Reporte tecnico de auditoria y correccion de incidencias
└── CONTRATO_API.md       # Especificacion tecnica del contrato de interoperabilidad API
```

---

## 7. Documentacion Adicional

- [INFORME_INCIDENTES.md](file:///c:/Users/facun/mobileapp/INFORME_INCIDENTES.md): Analisis causa-raiz de los 6 incidentes tecnicos resueltos y uso responsable de IA.
- [CONTRATO_API.md](file:///c:/Users/facun/mobileapp/CONTRATO_API.md): Especificacion de endpoints, modelos de datos y codigos HTTP cliente-servidor.
