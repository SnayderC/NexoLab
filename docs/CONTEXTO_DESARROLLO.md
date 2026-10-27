# NexoLab — Contexto completo para el desarrollo

> **Qué es este documento:** la referencia única del proyecto para desarrollar en VS Code. Sirve para el equipo y también como contexto para asistentes de IA (GitHub Copilot, Claude, etc.).
> **Dónde va:** en el repositorio, en `docs/CONTEXTO_DESARROLLO.md`.
> **Regla de oro:** si algo del código contradice este documento, se corrige uno de los dos y se registra en la sección 17 (Decisiones).
> **Última actualización:** 24/10/2026 · Base de datos v4 y prototipo de Figma aprobados por el tutor y la docente.

---

## Índice

1. [El proyecto](#1-el-proyecto)
2. [Alcance](#2-alcance)
3. [Roles y funcionalidades](#3-roles-y-funcionalidades)
4. [Stack tecnológico](#4-stack-tecnológico)
5. [Arquitectura](#5-arquitectura)
6. [Estructura del repositorio](#6-estructura-del-repositorio)
7. [Convenciones](#7-convenciones)
8. [Modelo de datos](#8-modelo-de-datos)
9. [Reglas de negocio](#9-reglas-de-negocio)
10. [Modelo K-Means](#10-modelo-k-means)
11. [Sistema de diseño](#11-sistema-de-diseño)
12. [Pantallas y rutas](#12-pantallas-y-rutas)
13. [API planificada](#13-api-planificada)
14. [Datos de demostración](#14-datos-de-demostración)
15. [Plan de desarrollo por fases](#15-plan-de-desarrollo-por-fases)
16. [Seguridad y calidad](#16-seguridad-y-calidad)
17. [Decisiones registradas](#17-decisiones-registradas)
18. [Pendientes y preguntas abiertas](#18-pendientes-y-preguntas-abiertas)
19. [Fuera de alcance](#19-fuera-de-alcance)

---

## 1. El proyecto

**Título:** Aplicativo web de gestión de incidencias con clustering de riesgo de equipos para el Bloque H.
**Institución:** UNEMI — Carrera de Ingeniería de Software. Proyecto de titulación (Grupo F).
**Equipo:** Jostyn Snayder Cedeño Jiménez · Joan Martin Rodríguez Cruz.

**Problema:** en los laboratorios del Bloque H muchas incidencias se atienden sin registrarse. No hay historial por equipo ni tiempos de atención, el personal técnico desconoce su carga real de trabajo y las decisiones de reemplazo no se basan en datos.

**Solución:** una aplicación web donde los técnicos registran y cierran incidencias, el sistema calcula automáticamente el tiempo de atención, y un modelo **K-Means** agrupa los equipos en tres niveles de riesgo (alto, medio, bajo) para priorizar su atención.

**Frase para la defensa:** el modelo **prioriza** equipos según sus patrones de falla; **no predice** la fecha exacta en que un equipo va a fallar.

---

## 2. Alcance

### Dentro del alcance (aprobado)

- Registro y seguimiento de incidencias por laboratorio y equipo.
- Cierre con diagnóstico y acción tomada: Resuelto, Requiere reemplazo o Derivado.
- Retiro automático del equipo cuando la acción es "Requiere reemplazo".
- Cálculo automático del tiempo de atención.
- Agrupamiento de equipos por riesgo con K-Means y dashboard con los 3 niveles.
- Historial y evolución del riesgo por equipo.
- **Configuración visual del catálogo de tipos de equipo** (pedida por el tutor): demuestra que el sistema sirve para otras instituciones.
- Administración de laboratorios, equipos, catálogo y usuarios.
- Dos roles: Técnico de soporte y Administrador.
- Ejecución local con Docker (sin despliegue en la nube).

### Fuera del alcance

Ver la sección 19.

---

## 3. Roles y funcionalidades

| Funcionalidad | Técnico | Administrador |
|---|:---:|:---:|
| Iniciar sesión y cambiar su contraseña | ✅ | ✅ |
| Ver el dashboard de riesgo y filtrarlo por laboratorio o tipo | ✅ | ✅ |
| Registrar incidencias | ✅ | ✅ |
| Ver y filtrar la lista de incidencias | ✅ | ✅ |
| Cerrar incidencias (diagnóstico y acción) | ✅ | ✅ |
| Ver el historial y la evolución del riesgo de un equipo | ✅ | ✅ |
| Recalcular el riesgo manualmente | ❌ | ✅ |
| Gestionar laboratorios | ❌ | ✅ |
| Gestionar equipos (crear, editar, retirar) | ❌ | ✅ |
| Configurar el catálogo de tipos de equipo | ❌ | ✅ |
| Gestionar usuarios (crear, activar o desactivar, restablecer contraseña) | ❌ | ✅ |

- Un técnico puede atender **cualquier** laboratorio. No está atado a uno.
- Los permisos se aplican **en el backend**. Ocultar un botón en el frontend no es seguridad.

---

## 4. Stack tecnológico

Versiones verificadas el 24/10/2026. Al instalar, se fijan con los archivos de bloqueo (`package-lock.json`) y rangos en `requirements.txt`.

### Backend

| Herramienta | Versión | Para qué |
|---|---|---|
| Python | 3.12 | Lenguaje |
| Django | 5.2 LTS (5.2.18) | Framework web. LTS = soporte extendido |
| Django REST Framework | 3.18 | API REST |
| PostgreSQL | 17 (en Docker) | Base de datos |
| psycopg | 3 | Conector de PostgreSQL |
| django-environ | 0.14 | Leer variables de entorno |
| scikit-learn, pandas, numpy | (fase K-Means) | Modelo de riesgo |

### Frontend

| Herramienta | Versión | Para qué |
|---|---|---|
| Node.js | 22 LTS o superior (mínimo 20.19 / 22.12) | Requisito de Vite |
| Vite | 8 | Servidor de desarrollo y build |
| React | 19 | Interfaz |
| TypeScript | la que instale la plantilla de Vite | Tipado |
| Tailwind CSS | 4 (`@tailwindcss/vite`) | Estilos |
| React Router | 8 | Navegación entre pantallas |
| TanStack Query | 5 | Pedir datos a la API, con caché y estados de carga |
| React Hook Form + Zod | 7 / 4 | Formularios y validaciones |
| @hookform/resolvers | 5 | Conecta Zod con React Hook Form (ver D-15) |
| lucide-react | actual | Íconos (el Figma usa estilo Lucide) |
| Recharts | 3 | Gráfico de evolución del riesgo |

**Regla:** no se agrega ninguna dependencia que no esté en esta tabla sin justificarla y registrarla en la sección 17.

### Herramientas de desarrollo

VS Code, Git y GitHub, Docker Desktop, GitHub Copilot (necesario para conectar Figma con VS Code).

---

## 5. Arquitectura

```
┌──────────────────────┐   HTTP / JSON    ┌─────────────────────────────┐      ┌──────────────┐
│ Frontend (React SPA) │ ───────────────► │ Backend (Django + DRF)      │ ───► │ PostgreSQL   │
│ Vite · localhost:5173│   /api/v1/...    │ localhost:8000              │      │ (Docker)     │
└──────────────────────┘                  │  ├─ apps/users              │      └──────────────┘
                                          │  ├─ apps/infrastructure     │
                                          │  ├─ apps/incidents          │
                                          │  └─ apps/risk (K-Means)     │
                                          └─────────────────────────────┘
```

- **Monorepo:** frontend y backend en el mismo repositorio.
- **El frontend no tiene lógica de negocio.** Muestra datos y valida formularios para mejorar la experiencia, pero el backend vuelve a validar todo.
- **En desarrollo**, Vite redirige `/api` al backend (proxy). Así ambos parecen estar en el mismo origen y se evitan problemas de CORS y de cookies.
- **La lógica de negocio va en servicios** (`apps/<app>/services.py`), no en las vistas. Las vistas solo reciben la petición, llaman al servicio y responden.
- **K-Means se ejecuta dentro de Django**, justo después de confirmar la transacción que lo dispara (por ejemplo, el cierre de una incidencia). No se usan Celery ni Redis (decisión D-06).

---

## 6. Estructura del repositorio

```
nexolab/
├── .github/
│   └── copilot-instructions.md   # resumen corto de este documento para Copilot
├── docs/
│   ├── CONTEXTO_DESARROLLO.md    # este documento
│   ├── NEXOLAB_BD_v4.dbml        # modelo de datos aprobado
│   └── PROMPT_FIGMA_MAKE_NEXOLAB.md  # datos de demostración de referencia
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/                   # settings.py, urls.py
│   └── apps/
│       ├── core/                 # BaseModel y utilidades comunes
│       ├── users/                # cat_roles, mst_users
│       ├── infrastructure/       # laboratorios, tipos, estados y equipos
│       ├── incidents/            # incidencias y sus catálogos
│       └── risk/                 # niveles de riesgo y tablas hst_ de K-Means
└── frontend/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── index.css             # Tailwind + tokens del sistema de diseño
        ├── app/                  # router y proveedores (TanStack Query)
        ├── components/
        │   ├── ui/               # Button, Badge, Input, Select, Modal, Table, Toast, Skeleton, EmptyState
        │   └── layout/           # AppLayout, Sidebar, Topbar
        ├── features/             # una carpeta por módulo
        │   ├── auth/
        │   ├── dashboard/
        │   ├── incidents/
        │   ├── devices/
        │   ├── laboratories/
        │   ├── catalog/
        │   ├── users/
        │   └── profile/
        ├── types/                # tipos de TypeScript que reflejan la BD
        ├── mocks/                # datos de demostración (hasta conectar la API)
        └── lib/                  # cliente de API, formato de fechas, utilidades
```

Cada carpeta de `features/` contiene `pages/` (pantallas completas), `components/` (piezas propias del módulo) y `api.ts` (funciones que piden datos).

---

## 7. Convenciones

### Idioma

| Qué | Idioma |
|---|---|
| Código: variables, funciones, clases, archivos, tablas y columnas | Inglés |
| Textos que ve el usuario | Español (Ecuador) |
| Rutas de la interfaz (URLs del navegador) | Español (`/incidencias`) |
| Rutas de la API | Inglés (`/api/v1/incidents`) |
| Commits | Español, con el formato de la tabla de abajo |
| Documentación | Español |

### Base de datos (aprobada por la docente)

- Inglés, minúsculas, `snake_case`. Tablas en plural con **prefijo por tipo**:
  `cat_` catálogo · `mst_` maestra · `trx_` transaccional · `hst_` histórica.
- Clave primaria: `id`. Clave foránea: `<entidad>_id` o `<rol>_id` (`reported_by_id`).
- Booleanos: `is_` o `has_`. Fecha y hora: `_at`. Cantidades: `_count`. Promedios: `avg_`. Unidades al final: `_minutes`, `_days`, `_ms`.
- **Todas las tablas** tienen `is_active`, `created_at` y `updated_at`.
- Códigos internos en inglés y mayúsculas (`OPEN`, `RETIRED`). Texto visible en la columna `name`, en español.
- Nombres de índices y restricciones: máximo **30 caracteres** (límite de Django).

### Python / Django

- PEP 8. Modelos en singular (`Device`) con `db_table` explícito (`mst_devices`).
- Todo modelo hereda de `apps.core.models.BaseModel`, excepto `User` (declara los mismos campos a mano).
- Lógica de negocio en `services.py`. Operaciones que tocan varias tablas, dentro de `transaction.atomic()`.
- Nunca borrar filas (`.delete()`) desde la aplicación: se usa `is_active = False`.

### TypeScript / React

- Componentes en `PascalCase` (`RiskBadge.tsx`), hooks con prefijo `use` (`useIncidents`).
- El JSON de la API usa `snake_case`, igual que la BD. Los tipos de TypeScript respetan esos nombres; no se traducen a `camelCase`.
- **Ningún color, tamaño o espacio "quemado"** en los componentes: se usan los tokens de la sección 11.
- **Ningún dato de prueba dentro de un componente.** Los datos vienen de `features/<módulo>/api.ts`, que al principio lee de `mocks/` y después de la API real.
- Componentes pequeños. Si un archivo supera unas 200 líneas, probablemente hay que dividirlo.

### Git

- Ramas: `main` (siempre funciona) y ramas de trabajo `feature/<tema>`, `fix/<tema>`.
- Commits con formato `tipo: descripción`. Tipos: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`.
  Ejemplo: `feat: pantalla de login con estados de error`.
- Nada se sube a `main` sin probarlo antes en local.

---

## 8. Modelo de datos

Fuente de verdad: `docs/NEXOLAB_BD_v4.dbml`. 14 tablas, 19 relaciones, 144 columnas, verificadas contra PostgreSQL.

| Tipo | Tabla | Qué guarda |
|---|---|---|
| Catálogo | `cat_roles` | TECHNICIAN, ADMIN |
| Catálogo | `cat_device_types` | 32 tipos de equipo. `is_selected` = elegido por la institución |
| Catálogo | `cat_device_statuses` | ACTIVE, RETIRED. `is_included_in_kmeans` |
| Catálogo | `cat_components` | PC, MONITOR, KEYBOARD, MOUSE, UPS (componente afectado) |
| Catálogo | `cat_incident_statuses` | OPEN, CLOSED. `is_final` |
| Catálogo | `cat_resolution_actions` | RESOLVED, REPLACEMENT_REQUIRED, REFERRED. `is_retirement_action` |
| Catálogo | `cat_risk_levels` | HIGH, MEDIUM, LOW, con color y acción recomendada |
| Maestra | `mst_users` | Usuarios. Login por `email`; `password_hash` |
| Maestra | `mst_laboratories` | Laboratorios. `responsible_technician_id` opcional |
| Maestra | `mst_devices` | Equipos físicos. `device_status_id` = estado de negocio |
| Transaccional | `trx_incidents` | Incidencias |
| Histórica | `hst_kmeans_runs` | Bitácora de cada ejecución del modelo |
| Histórica | `hst_kmeans_centroids` | Perfil promedio de cada grupo |
| Histórica | `hst_device_risk_results` | Nivel de riesgo de cada equipo por ejecución. `is_current` = el vigente |

**Estado de registro vs estado de negocio.** `is_active` indica si la fila es válida o fue anulada (eliminación lógica). `device_status_id` e `incident_status_id` indican la situación real. Un equipo **retirado** sigue siendo un registro **activo** con su historial; un equipo **registrado por error** se anula con `is_active = false`.

**Fechas de una incidencia.** `opened_at` = cuándo ocurrió la falla (la indica el técnico). `created_at` = cuándo se registró en el sistema. Pueden ser distintas.

---

## 9. Reglas de negocio

Cada regla se aplica en el **backend**. El frontend puede validarlas antes para dar mejores mensajes.

### Autenticación y usuarios

- **RN-01** El login es con correo y contraseña. Ante cualquier fallo de credenciales se muestra un mensaje **genérico**: "Correo o contraseña incorrectos". Nunca se revela si el correo existe.
- **RN-02** Un usuario con `is_active = false` no puede iniciar sesión: "Tu cuenta está desactivada. Contacta al administrador."
- **RN-03** No hay registro público ni recuperación de contraseña por correo. El administrador crea usuarios y restablece contraseñas.
- **RN-04** Las contraseñas cumplen los 4 validadores por defecto de Django: mínimo 8 caracteres, no solo números, no parecida a los datos del usuario y no común.
- **RN-05** Un usuario no puede desactivarse a sí mismo.
- **RN-06** Un técnico que intenta acceder a una función de administración recibe un error 403 (backend) y la pantalla "Acceso restringido" (frontend).

### Catálogo e infraestructura

- **RN-07** Solo los tipos con `is_selected = true` aparecen en formularios y entran al cálculo de riesgo. Debe haber al menos un tipo seleccionado.
- **RN-08** Al guardar cambios en el catálogo se recalcula el riesgo (disparador `CATALOG_CHANGE`).
- **RN-09** Un nuevo tipo agregado al catálogo se crea con `is_selected = false`.
- **RN-10** No se puede desactivar un laboratorio con incidencias abiertas.
- **RN-11** Formato de código de equipo: `LAB-TIPO-NN` (ej. `H103-PC-03`). Es único.
- **RN-12** Al retirar un equipo se llena `retired_at` y deja de aparecer en formularios y en el cálculo de riesgo. Su historial se conserva.

### Incidencias

- **RN-13** Solo se registran incidencias en equipos con estado ACTIVE, `is_active = true`, de un laboratorio activo y de un tipo seleccionado.
- **RN-14** `incident_number` lo genera el backend con el formato `INC-AAAA-NNNN`, correlativo por año.
- **RN-15** `reported_by` y `closed_by` son siempre el usuario autenticado. **Nunca** se aceptan desde el cliente.
- **RN-16** `description` entre 10 y 500 caracteres. `opened_at` no puede ser futura.
- **RN-17** Para cerrar: `diagnosis` obligatorio (10–500 caracteres), `resolution_action` obligatoria y `closed_at` posterior o igual a `opened_at` y no futura.
- **RN-18** Al cerrar, `resolution_time_minutes = closed_at − opened_at` (en minutos, calculado por el backend).
- **RN-19** Si la acción tiene `is_retirement_action = true`, el equipo pasa a RETIRED con `retired_at = closed_at`. **En la misma transacción** que el cierre.
- **RN-20** "Derivado" (enviado a taller externo) **cierra** la incidencia. Si el equipo vuelve a fallar, se registra una nueva.
- **RN-21** Una incidencia cerrada (`is_final = true`) no se modifica.
- **RN-22** Anular una incidencia registrada por error es `is_active = false` (solo administrador). Las anuladas no cuentan para el riesgo ni para los indicadores.

---

## 10. Modelo K-Means

### Variables (por equipo)

| Variable | Cálculo |
|---|---|
| `incident_count` | Cantidad de incidencias válidas (`is_active = true`) del equipo |
| `days_since_last_failure` | Días entre la última `opened_at` y el momento del cálculo |
| `avg_failure_interval_days` | (última `opened_at` − primera `opened_at`) / (cantidad − 1) |

### Proceso

1. Tomar los equipos elegibles: `is_active = true`, estado con `is_included_in_kmeans = true` y tipo con `is_selected = true`.
2. **Regla de historial insuficiente (RN-23):** los equipos con menos de 2 incidencias se clasifican como LOW con `classification_method = INSUFFICIENT_HISTORY` y sin centroide. No entran al algoritmo.
3. Escalar las 3 variables (tienen magnitudes distintas) y ejecutar K-Means con `k = 3` y una **semilla fija**, que se guarda.
4. Asignar el nivel a cada grupo según el perfil de su centroide: el grupo con más incidencias y fallas más recientes y frecuentes es HIGH.
5. Guardar en una sola transacción: la ejecución (`hst_kmeans_runs`) con sus métricas, los centroides y un resultado por equipo. Los resultados anteriores pasan a `is_current = false`.

### Disparadores (`trigger_type`)

`INITIAL_LOAD` (entrenamiento inicial con el dataset de Kaggle), `INCIDENT_CLOSED`, `CATALOG_CHANGE` y `MANUAL` (botón del administrador).

### Métricas que se guardan

Inercia, coeficiente de silueta (de −1 a 1, más alto es mejor) e índice Davies-Bouldin (más bajo es mejor).

### Dataset de Kaggle

- Se guarda como archivo en el repositorio (`backend/data/`). **No se inserta** en las tablas de operación, porque no son equipos de la UNEMI.
- Se usa en la ejecución `INITIAL_LOAD`: sus centroides permiten clasificar los equipos del Bloque H mientras no haya suficiente historial propio.
- El origen (archivo, cantidad de registros y hash) queda en `hst_kmeans_runs.parameters`.
- Pendiente de definir el mínimo de equipos con historial propio para dejar de usar el modelo inicial (sección 18).

---

## 11. Sistema de diseño

Tokens tomados del prototipo de Figma. En el código se definen una sola vez en `frontend/src/index.css` (bloque `@theme` de Tailwind 4) y se usan como clases (`bg-primary`, `text-risk-high`).

### Colores

| Token | Valor | Uso |
|---|---|---|
| `primary` | `#3B82F6` | Acciones, enlaces, elementos activos |
| `primary-hover` | `#1E40AF` | Hover del primario |
| `accent` | `#7C3AED` | Final del degradado, detalles |
| Degradado principal | `#3B82F6 → #7C3AED` | Botón principal y panel del login |
| `text` | `#1F2937` | Texto principal |
| `text-muted` | `#6B7280` | Texto secundario |
| `text-secondary` | `#4B5563` | Opciones inactivas del menú lateral |
| `border` | `#D1D5DB` | Bordes de campos y botones secundarios |
| `border-subtle` | `#E5E7EB` | Bordes de barras, tarjetas y filas de tabla |
| `nav-active` | `#4F46E5` | Texto e ícono de la opción activa del menú |
| `nav-active-bg` | `#EEF2FF` | Fondo de la opción activa del menú |
| `background` | `#F3F4F6` | Fondo de página |
| `surface` | `#FFFFFF` | Tarjetas y modales |
| `success` | `#10B981` | Éxito |
| `warning` | `#F59E0B` | Advertencias |
| `danger` | `#EF4444` | Errores (fondo `#FEE2E2`) |

### Colores de riesgo (iguales a `cat_risk_levels.color_hex`)

| Nivel | Color |
|---|---|
| Riesgo alto | `#EF4444` |
| Riesgo medio | `#F59E0B` |
| Riesgo bajo | `#10B981` |

### Colores de badges, avisos y capas (tomados del Figma)

Fondos claros y textos oscuros de los badges, mensajes y modales. Todos son colores de la paleta estándar de Tailwind.

| Token | Valor | Uso |
|---|---|---|
| `risk-high-bg` / `risk-high-text` | `#FEF2F2` / `#B91C1C` | Badge y columna de riesgo alto |
| `risk-medium-bg` / `risk-medium-text` | `#FFFBEB` / `#B45309` | Badge y columna de riesgo medio |
| `risk-low-bg` / `risk-low-text` | `#ECFDF5` / `#047857` | Badge y columna de riesgo bajo |
| `danger-bg` / `danger-text` | `#FEE2E2` / `#B91C1C` | Prioridad alta, errores |
| `danger-strong` | `#DC2626` | Botón de acción peligrosa ("Retirar equipo") |
| `warning-bg` / `warning-text` | `#FEF3C7` / `#92400E` | Prioridad media |
| `warning-border` | `#FDE68A` | Borde del aviso de retiro del equipo (cerrar incidencia) |
| `success-bg` / `success-text` | `#ECFDF5` / `#047857` | Estados Activo y Cerrada |
| `info-bg` / `info-border` / `info-text` | `#EFF6FF` / `#BFDBFE` / `#1E40AF` | Estado Abierta, aviso de análisis, opción y página seleccionadas |
| `neutral-bg` / `neutral-text` | `#F3F4F6` / `#4B5563` | Prioridad baja, Retirado |
| `text-disabled` | `#9CA3AF` | Texto de campos deshabilitados |
| `skeleton` | `#E5E7EB` | Esqueletos de carga |
| `overlay` | `#111827` al 40 % | Fondo oscurecido de modales |

Sombras: `shadow-menu` (listas desplegables), `shadow-toast` (mensajes emergentes) y `shadow-modal` (modales). Tamaño extra: `text-2xs` (11 px) para rótulos de sección y cabeceras de tabla.

### Tipografía y formas

- Fuente **Inter**. Título de página 24 px semibold · título de tarjeta 16 px semibold · texto 14 px · secundario 12 px.
- Esquinas de 8 px, sombras suaves, íconos lineales (Lucide).
- Tablas: encabezado fijo, filas de 48 px, paginación al pie.
- Formularios: etiqueta arriba, `*` en obligatorios, error en rojo debajo del campo.
- Diseño para escritorio de 1440 px, adaptable a tablet.

### Badges

- Prioridad: Alta (rojo), Media (ámbar), Baja (gris).
- Estado de incidencia: Abierta (azul), Cerrada (verde).
- Estado de equipo: Activo (verde), Retirado (gris).
- "Sin historial suficiente": gris con ícono de información.

### Estructura de la aplicación

Barra lateral fija con el logo y el menú (Dashboard, Incidencias, Registrar incidencia y, solo para el administrador, la sección Administración). Barra superior con el título de la página, la fecha y el menú del usuario ("Mi perfil" y "Cerrar sesión").

### Comportamientos comunes

Mensajes emergentes (toast) arriba a la derecha que se cierran a los 4 segundos; diálogos de confirmación en acciones importantes; esqueletos grises mientras carga; estado vacío con ícono y texto; pantalla de error con botón "Reintentar".

---

## 12. Pantallas y rutas

Referencia visual: archivo de Figma "Nexolab — Prototipo 1.0" (53 frames). Datos: ver sección 13.

| Pantalla | Ruta | Rol | Página de Figma | Datos principales |
|---|---|---|---|---|
| Iniciar sesión | `/login` | Público | 01 · Autenticación | `mst_users` |
| Dashboard de riesgo | `/` | Ambos | 02 · Dashboard | `hst_device_risk_results`, `hst_kmeans_centroids`, `hst_kmeans_runs`, `trx_incidents` |
| Lista de incidencias | `/incidencias` | Ambos | 03 · Incidencias | `trx_incidents` |
| Registrar incidencia | `/incidencias/nueva` | Ambos | 03 · Incidencias | `mst_laboratories`, `mst_devices`, `cat_components` |
| Cerrar incidencia (modal) | sobre `/incidencias` | Ambos | 03 · Incidencias | `trx_incidents`, `cat_resolution_actions` |
| Historial del equipo | `/equipos/:code` | Ambos | 04 · Equipos | `mst_devices`, `trx_incidents`, `hst_device_risk_results` |
| Laboratorios | `/admin/laboratorios` | Admin | 05 · Administración | `mst_laboratories` |
| Equipos | `/admin/equipos` | Admin | 05 · Administración | `mst_devices` |
| Catálogo de equipos | `/admin/catalogo` | Admin | 05 · Administración | `cat_device_types` |
| Usuarios | `/admin/usuarios` | Admin | 05 · Administración | `mst_users`, `cat_roles` |
| Mi perfil | `/perfil` | Ambos | 06 · Perfil | `mst_users` |
| Acceso restringido | (cualquier ruta `/admin` para técnicos) | Técnico | 05 · Administración | — |

**Elementos del prototipo que NO se programan:** los interruptores "Ver como técnico" y "Simular error de carga" (eran solo para probar el prototipo).

---

## 13. API planificada

Base: `/api/v1/`. JSON en `snake_case`. Todos los endpoints requieren autenticación, salvo el login. Los marcados con 🔒 son solo para administrador. Esta lista puede ajustarse al implementar; cualquier cambio se refleja aquí.

| Método y ruta | Uso |
|---|---|
| `POST auth/login` · `POST auth/logout` · `GET auth/me` | Sesión |
| `POST auth/change-password` | Mi perfil |
| `GET catalogs` | Componentes, estados, acciones, niveles de riesgo y tipos seleccionados |
| `GET dashboard/summary` | Indicadores, grupos de riesgo y última ejecución |
| `GET incidents` · `POST incidents` | Lista con filtros y paginación · registrar |
| `GET incidents/{id}` · `POST incidents/{id}/close` | Detalle · cerrar |
| `POST incidents/{id}/void` 🔒 | Anular (registro por error) |
| `GET devices` · `GET devices/{code}` | Lista y detalle |
| `GET devices/{code}/incidents` · `GET devices/{code}/risk-history` | Historial |
| `POST devices` 🔒 · `PATCH devices/{code}` 🔒 · `POST devices/{code}/retire` 🔒 | Gestión |
| `GET laboratories` · `POST` 🔒 · `PATCH laboratories/{id}` 🔒 · `POST laboratories/{id}/deactivate` 🔒 | Laboratorios |
| `GET device-types` 🔒 · `POST device-types` 🔒 · `PUT device-types/selection` 🔒 | Catálogo |
| `GET users` 🔒 · `POST users` 🔒 · `PATCH users/{id}` 🔒 | Usuarios |
| `POST users/{id}/reset-password` 🔒 · `POST users/{id}/activate` 🔒 · `POST users/{id}/deactivate` 🔒 | Usuarios |
| `POST risk/recalculate` 🔒 | Recálculo manual |

**Errores:** códigos HTTP estándar (400 validación, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto de regla de negocio). Cuerpo: `{"detail": "mensaje en español"}` o, en validaciones, `{"campo": ["mensaje"]}`. Nunca se devuelven trazas internas.

---

## 14. Datos de demostración

El archivo `docs/PROMPT_FIGMA_MAKE_NEXOLAB.md` (parte 3) contiene el conjunto de datos coherente que usa el prototipo. Es la base de `frontend/src/mocks/` y, más adelante, de un comando de Django para cargar datos de demostración.

Valores clave que deben cuadrar en todas las pantallas:

- Usuarios: Andrea Villacís (administradora), Carlos Mendoza (técnico), Luis Bravo (técnico inactivo).
- 5 laboratorios (H101–H105), **142 equipos activos** y 3 retirados.
- 5 tipos seleccionados de 32: PC, Monitor, Todo en uno, UPS y Televisor.
- Riesgo: **6 alto, 18 medio, 118 bajo** (21 por K-Means + 97 sin historial).
- Incidencias: **205 en total** (7 abiertas, 198 cerradas).
- "Hora actual" del prototipo: 17/10/2026 11:30.

En la defensa se aclara que son **datos de demostración**, no datos reales del Bloque H.

---

## 15. Plan de desarrollo por fases

Orden acordado: **primero la interfaz con datos de demostración, después el backend, y al final conectarlos.**

### Fase 0 — Preparación ✅ (base lista)
- [x] Proyecto Django con modelos v4, migraciones y catálogos.
- [x] 14 pruebas de integridad de la BD pasando sobre PostgreSQL.
- [ ] Crear el repositorio privado en GitHub y subir la base.
- [ ] Agregar `docs/` con este documento, el DBML y el prompt de Figma.
- [ ] Crear `.github/copilot-instructions.md`.

### Fase 1 — Base del frontend
- [x] Crear el proyecto con Vite (React + TypeScript) en `frontend/`.
- [x] Configurar Tailwind 4 y los tokens de la sección 11.
- [ ] Conectar Figma con VS Code (guía aparte: `GUIA_FIGMA_A_CODIGO.md`).
- [x] Componentes base de `components/ui/`.
- [x] `AppLayout` con barra lateral y superior, y router con todas las rutas.
- **Terminado cuando:** se puede navegar entre todas las rutas (aunque estén vacías) con el layout igual al Figma.

### Fase 2 — Pantallas con datos de demostración
- [x] Tipos de TypeScript en `types/` que reflejan la BD.
- [x] Datos de demostración en `mocks/`: catálogos, usuarios, laboratorios, 145 equipos, resultados de riesgo y las 12 incidencias del documento (ver D-17).
- [ ] Pantallas en este orden: Login → Dashboard → Incidencias (lista, registrar, cerrar) → Historial → Administración → Perfil.
- [ ] Cada pantalla con sus estados: carga, vacío, error y validaciones.
- **Terminado cuando:** la aplicación se ve y se comporta como el prototipo, leyendo de `mocks/` a través de `api.ts`.

### Fase 3 — Autenticación y permisos (backend)
- [ ] Decidir el método de autenticación (sección 18).
- [ ] Login, logout, usuario actual, cambio de contraseña.
- [ ] Permisos por rol (técnico y administrador) con pruebas.

### Fase 4 — API de administración
- [ ] Laboratorios, equipos, catálogo y usuarios, con sus reglas y pruebas.
- [ ] Comando para cargar los laboratorios y equipos del Bloque H.

### Fase 5 — API de incidencias
- [ ] Registrar, listar con filtros, detalle, cerrar y anular.
- [ ] Retiro automático, tiempo de atención y numeración, con pruebas.

### Fase 6 — Modelo K-Means
- [ ] Servicio de cálculo de variables, agrupamiento y asignación de niveles.
- [ ] Entrenamiento inicial con Kaggle y disparadores.
- [ ] Endpoint del dashboard e historial de riesgo, con pruebas.

### Fase 7 — Conectar frontend y backend
- [ ] Cambiar cada `api.ts` de `mocks/` a la API real.
- [ ] Probar todos los flujos con los dos roles.

### Fase 8 — Cierre
- [ ] Docker Compose con todos los servicios.
- [ ] Comando de datos de demostración.
- [ ] Documentación final y guion de la demostración.

---

## 16. Seguridad y calidad

### Seguridad

- Ninguna credencial en el código. Todo en `.env` (excluido por `.gitignore`), con un `.env.example` de referencia.
- Contraseñas siempre con hash (Django lo hace con `set_password`).
- Permisos verificados en el backend en cada endpoint.
- El usuario que registra o cierra se toma de la sesión, nunca del cuerpo de la petición.
- Validación de entradas en el backend aunque el frontend ya valide.
- Mensajes de error genéricos en el login y sin trazas internas en las respuestas.
- No guardar tokens o datos sensibles en `localStorage`.

### Antes de cada commit

- [ ] `python manage.py check` y `python manage.py test apps` sin errores (backend).
- [ ] `npm run lint` y `npm run build` sin errores (frontend).
- [ ] Probar en el navegador la pantalla o función que se cambió.
- [ ] Revisar que no se suba ningún `.env`.

---

## 17. Decisiones registradas

| ID | Decisión | Motivo |
|---|---|---|
| D-01 | Carga inicial de equipos por comando, sin pantalla de importación CSV | El alcance aprobado no incluye importación masiva |
| D-02 | `components` separada de `device_types` | El estudio de caso distingue equipos de componentes afectados (mouse y teclado no son equipos) |
| D-03 | Equipos con menos de 2 incidencias → riesgo bajo por regla | K-Means necesita las 3 variables, que no existen sin historial |
| D-04 | Los técnicos no están atados a un laboratorio | En la práctica, un técnico puede atender todos |
| D-05 | Nombres en inglés con prefijos por tipo y campos de control en todas las tablas | Buenas prácticas y retroalimentación de la docente |
| D-06 | Sin Celery ni Redis: K-Means se ejecuta dentro de Django después de confirmar la transacción | Con ~142 equipos tarda milisegundos; dos servicios menos *(pendiente de confirmación del equipo)* |
| D-07 | Django 5.2 LTS | Django 4.2 terminó su soporte en abril de 2026 |
| D-08 | "Derivado" cierra la incidencia | Simplicidad; una nueva falla se registra como nueva incidencia |
| D-09 | Sin registro público ni recuperación por correo | Sistema interno; el estudio de caso excluye notificaciones por correo |
| D-10 | Login con mensaje de error genérico | Evita revelar qué correos están registrados |
| D-11 | Frontend primero con datos de demostración, después el backend | Acuerdo del equipo para avanzar por partes |
| D-12 | Tokens `text-secondary`, `border-subtle`, `nav-active` y `nav-active-bg` agregados a la sección 11 | El layout del Figma usa esos colores y no existían como tokens |
| D-13 | Tokens de badges, avisos, sombras y `text-2xs` agregados a la sección 11 | Los componentes del Figma los usan; así ningún componente lleva colores fijos |
| D-14 | `Select` con lista desplegable propia en lugar del `<select>` del navegador | El `<select>` nativo no permite el estilo del Figma (opción marcada con ✓ y fondo índigo) |
| D-15 | Se agrega `@hookform/resolvers` 5 | Es el adaptador oficial para validar formularios de React Hook Form con Zod. La versión 6 tiene un conflicto entre sus dependencias opcionales |
| D-16 | Login simulado hasta la fase 7: contraseña de demostración en `VITE_DEMO_PASSWORD` (`frontend/.env.local`) y sesión en `localStorage` | Permite probar todos los estados del login sin backend y sin credenciales en el código. Se reemplaza por la sesión de Django (sección 18) |
| D-17 | Los datos de demostración copian el Figma tal cual: solo las 12 incidencias del documento, y los indicadores y promedios del prototipo (48 min, 9,2 incidencias) se guardan como valores fijos | Son datos temporales que desaparecen al conectar el backend (fase 7); el backend calculará los valores reales |
| D-18 | La hora de referencia de los datos de demostración es el 17/10/2026 11:30 (`mocks/demoClock.ts`); registrar y cerrar incidencias modifican los datos en memoria | Es la hora que usa la página 03 del Figma. Los cambios permiten probar el flujo completo y se pierden al recargar, igual que todo dato de demostración |
| D-19 | El gráfico "Evolución del riesgo" se dibuja con SVG propio en lugar de Recharts | Son escalones de 3 niveles con un color por tramo (Figma 4.0): con SVG queda idéntico y se evita una dependencia. Recharts queda en la sección 4 por si se necesitan gráficos más complejos |
| D-20 | Un equipo retirado no vuelve a activarse; al editar un equipo no se cambian su código, laboratorio ni tipo | El retiro es el final de la vida del equipo (un registro por error se anula con `is_active`, sección 18). El código `LAB-TIPO-NN` incluye el laboratorio y el tipo |
| D-21 | El código de un equipo nuevo debe empezar con el laboratorio y el tipo elegidos (ej.: H103 + PC → `H103-PC-`) | Complementa RN-11: evita códigos con formato válido pero que no corresponden al equipo |

---

## 18. Pendientes y preguntas abiertas

- [ ] **Método de autenticación** (fase 3). Propuesta: sesión de Django con cookie `httpOnly` y protección CSRF, aprovechando el proxy de Vite. Es más segura que guardar un token JWT en el navegador y requiere menos código.
- [ ] **Confirmar D-06** (sin Celery ni Redis).
- [ ] **Inventario real** de los equipos del Bloque H (código, laboratorio y tipo) para el comando de carga. Si no existe, se usan datos de demostración.
- [ ] **Mínimo de equipos con historial** para dejar de usar el modelo inicial de Kaggle, y revisar que el CSV filtrado permita calcular las 3 variables.
- [ ] **Acciones de anulación en la interfaz:** "Eliminar equipo" y "Anular incidencia" (solo administrador) para usar `is_active`. Aún no están en el Figma.
- [ ] **Pantalla de reportes:** consultar con el tutor si se agrega (no requiere cambios en la BD).

---

## 19. Fuera de alcance

Se mencionan en Recomendaciones Futuras de la tesis, **no se programan**:

- Mantenimiento preventivo programado y ciclo de vida de los equipos.
- Importación masiva por CSV desde la interfaz.
- Exportación de reportes a PDF o Excel.
- Notificaciones por correo, Slack u otros medios.
- Integración con inventario institucional o directorio activo (LDAP).
- Predicción de fechas de falla (series de tiempo).
- Aplicación móvil y despliegue en la nube.
