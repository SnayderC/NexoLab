# NexoLab — Guía del proyecto en español

> **Para quién es:** para el autor y para cualquier persona que necesite entender el proyecto sin conocer los
> términos técnicos en inglés. Explica qué hace el sistema, cómo está construido y qué significa cada nombre.
> El detalle técnico y todas las decisiones están en [CONTEXTO_DESARROLLO.md](CONTEXTO_DESARROLLO.md).

---

## 1. Qué es NexoLab

**El problema:** en los laboratorios de cómputo, las fallas de los equipos se reportan de forma informal. No queda
historial, no se sabe qué equipos fallan más y no hay un criterio para decidir qué revisar primero.

**La solución:** una aplicación web donde:

1. Los técnicos **registran y cierran incidencias** (fallas), y el sistema calcula solo el tiempo de atención.
2. Un modelo de **inteligencia artificial (K-Means)** usa ese historial para agrupar los equipos en riesgo
   **alto** (revisar hoy), **medio** (revisar esta semana) y **bajo** (monitoreo normal).
3. Los administradores gestionan laboratorios, equipos, el catálogo de tipos de equipo y los usuarios.

El caso de origen es el Bloque H de la UNEMI, pero el sistema sirve para **cualquier laboratorio de cómputo**.

---

## 2. La arquitectura, explicada

"Arquitectura" es la forma en que se reparten las piezas del sistema. NexoLab tiene **tres piezas**:

```
   Navegador                         Servidor                          Datos
┌──────────────────┐  pide datos  ┌──────────────────────┐  guarda y  ┌──────────────┐
│  FRONTEND        │ ───────────► │  BACKEND             │ ─────────► │ BASE DE      │
│  (la pantalla)   │ ◄─────────── │  (las reglas)        │ ◄───────── │ DATOS        │
│  React           │  responde    │  Django              │  consulta  │ PostgreSQL   │
│  localhost:5173  │  en JSON     │  localhost:8000      │            │ (en Docker)  │
└──────────────────┘              └──────────────────────┘            └──────────────┘
```

| Pieza | Nombre técnico | Qué hace | Analogía |
|---|---|---|---|
| **Frontend** | React + TypeScript | Lo que la persona ve y usa: pantallas, botones, formularios. **No toma decisiones**: muestra datos y revisa los formularios para avisar errores rápido | El mesero: toma el pedido y lo lleva |
| **Backend** | Django + Django REST Framework | Aplica **todas las reglas** (RN-01 a RN-23), decide quién puede hacer qué, calcula el riesgo con K-Means y guarda los datos | La cocina: decide qué se puede preparar y lo prepara |
| **Base de datos** | PostgreSQL | Guarda todo de forma permanente: usuarios, equipos, incidencias, resultados del modelo | La despensa |

**¿Cómo se comunican?** El frontend le pide cosas al backend por una **API**: un conjunto de direcciones como
`/api/v1/incidents` (lista de incidencias) o `/api/v1/auth/login` (iniciar sesión). Las respuestas viajan en
**JSON**, un formato de texto que las dos partes entienden. La lista completa de direcciones está en la sección 13
de `CONTEXTO_DESARROLLO.md` y en `backend/README.md`.

**Regla de oro:** aunque el frontend revise un formulario, **el backend vuelve a revisarlo todo**. Así nadie puede
saltarse una regla manipulando la pantalla.

### Ejemplo completo: qué pasa cuando Carlos cierra una incidencia

1. Carlos llena el formulario "Cerrar incidencia" y pulsa el botón (**frontend**).
2. La pantalla revisa que el diagnóstico tenga al menos 10 caracteres y que la fecha no sea futura. Si algo falta,
   avisa sin molestar al servidor.
3. La pantalla envía los datos a `POST /api/v1/incidents/INC-2026-0302/close` (**API**).
4. El **backend** comprueba que Carlos tenga sesión, vuelve a validar todo (RN-17) y que la incidencia no esté ya
   cerrada (RN-21).
5. Calcula el tiempo de atención (RN-18) y guarda el cierre con Carlos como quien cerró (RN-15).
6. Si la acción fue "Requiere reemplazo", retira el equipo **en la misma operación** (RN-19).
7. Al confirmar el guardado, ejecuta el **K-Means** para actualizar el riesgo de todos los equipos.
8. Responde a la pantalla, que muestra "Incidencia cerrada y riesgo de los equipos actualizado" y refresca el
   Dashboard.

---

## 3. Glosario: los términos en inglés

### Términos generales

| Término | Significado |
|---|---|
| **Frontend** | La parte que se ve en el navegador |
| **Backend** | La parte que corre en el servidor: reglas y datos |
| **API** | Las "direcciones" por las que el frontend le pide cosas al backend |
| **Endpoint** | Una de esas direcciones, por ejemplo `GET /api/v1/devices` |
| **GET / POST / PATCH / PUT** | El tipo de pedido: **GET** consulta, **POST** crea o ejecuta una acción, **PATCH** modifica una parte, **PUT** reemplaza |
| **JSON** | Formato de texto en que viajan los datos |
| **Request / Response** | Pedido / respuesta |
| **Status 200, 201, 204** | Respuestas de éxito (ok, creado, hecho sin contenido) |
| **Status 400, 403, 404, 409** | Errores: datos inválidos, sin permiso o sin sesión, no existe, choca con una regla |
| **Session / Cookie** | La sesión es "Carlos ya inició sesión"; la cookie es la credencial que el navegador guarda para recordarlo |
| **CSRF** | Protección contra páginas maliciosas que intentan hacer acciones en tu nombre |
| **Proxy** | Intermediario: el servidor de la pantalla reenvía los pedidos `/api` al backend |
| **Migration** (migración) | Instrucciones que crean o cambian las tablas de la base de datos |
| **Seed** (sembrar) | Cargar datos de ejemplo en la base (`seed_demo`) |
| **Mock** | Datos falsos escritos en el código. Se usaron al inicio y **ya se eliminaron** |
| **Test** (prueba) | Programa que verifica automáticamente que una regla funcione. El backend tiene 90 |
| **Lint** | Revisión automática del estilo y de errores comunes del código |
| **Build** | Preparar la versión final de la pantalla para publicarla |
| **Docker / contenedor / imagen** | Docker empaqueta cada pieza con todo lo que necesita. Una **imagen** es el paquete; un **contenedor**, el paquete funcionando |
| **Commit / push** | Guardar una versión del código en Git / subirla a GitHub |
| **Repository (repo)** | La carpeta del proyecto con todo su historial de versiones |
| **Monorepo** | Frontend y backend en el mismo repositorio |
| **Environment variables (.env)** | Archivos con datos secretos o de configuración (contraseñas). No se suben a GitHub |

### Términos del backend (Django)

| Archivo o término | Qué es |
|---|---|
| `models.py` (**modelos**) | La definición de cada **tabla** de la base de datos, escrita en Python |
| `serializers.py` (**serializadores**) | Revisan los datos que llegan (validación) y convierten los registros a JSON para responder |
| `views.py` (**vistas**) | La "puerta de entrada" de cada endpoint: reciben el pedido, llaman a lo que corresponda y responden |
| `services.py` (**servicios**) | Las **reglas de negocio** con varios pasos, por ejemplo cerrar una incidencia o calcular el riesgo |
| `selectors.py` (**selectores**) | Consultas reutilizables a la base, por ejemplo "el riesgo vigente de cada equipo" |
| `urls.py` | La lista de direcciones (endpoints) de cada parte |
| `permissions.py` (**permisos**) | Quién puede hacer qué: por ejemplo, "solo administradores" (RN-06) |
| `tests.py` | Las pruebas automáticas |
| `management/commands/` | Comandos que se ejecutan en la terminal, como `seed_demo` o `recalculate_risk` |
| `settings.py` | La configuración general (base de datos, seguridad, idioma, zona horaria) |
| **App** | Cada módulo del backend (ver sección 4) |

### Términos del frontend (React)

| Archivo o término | Qué es |
|---|---|
| **Component** (componente) | Una pieza de pantalla reutilizable: un botón, una tabla, una tarjeta |
| **Page** (página) | Una pantalla completa, armada con componentes |
| **Feature** | Un módulo de la aplicación (incidencias, equipos, usuarios…) con sus páginas y componentes |
| `api.ts` | Las funciones que piden datos al backend en cada módulo |
| `use….ts` (**hooks**) | Funciones de React que piden los datos, los guardan en memoria y los refrescan cuando algo cambia |
| **Router** | Decide qué página mostrar según la dirección (`/incidencias`, `/reportes`…) |
| **Layout** | El marco común de las páginas: barra lateral y barra superior |
| **Props** | Los datos que una pieza le pasa a otra |
| **Toast** | El aviso pequeño que aparece y desaparece ("Incidencia registrada") |
| **Modal / Dialog** | Ventana que aparece encima de la pantalla |
| **Skeleton** | Los rectángulos grises animados mientras cargan los datos |
| **Tailwind / tokens** | Sistema de estilos; los **tokens** son los colores y tamaños con nombre (`primary`, `risk-high`) definidos en `index.css` |
| **TypeScript / types** | JavaScript con tipos: avisa errores antes de ejecutar. `types/` describe la forma de cada tabla |

---

## 4. El backend por dentro (`backend/`)

| Carpeta | Significa | Qué contiene |
|---|---|---|
| `config/` | Configuración | Ajustes generales y la lista principal de direcciones |
| `apps/core/` | Núcleo | La base común de las tablas, los catálogos pequeños y el comando `seed_demo` con los datos de demostración |
| `apps/users/` | Usuarios | Inicio de sesión, cambio de contraseña, permisos y administración de usuarios |
| `apps/infrastructure/` | Infraestructura | Laboratorios, equipos y el catálogo de tipos de equipo |
| `apps/incidents/` | Incidencias | Registrar, listar, cerrar y anular incidencias; también **Reportes** (`reports.py`) |
| `apps/risk/` | Riesgo | El modelo **K-Means**: `kmeans.py` (el algoritmo), `kaggle.py` (lee el dataset), `services.py` (calcula y guarda), el Dashboard y el comando `recalculate_risk` |
| `data/` | Datos | `ITSM_data.csv`, el dataset de Kaggle para la carga inicial del modelo |

---

## 5. El frontend por dentro (`frontend/src/`)

| Carpeta | Significa | Pantalla |
|---|---|---|
| `features/auth/` | Autenticación | Iniciar sesión y la sesión del usuario |
| `features/dashboard/` | Tablero | Dashboard de riesgo |
| `features/incidents/` | Incidencias | Lista, registrar, cerrar, detalle y anular |
| `features/devices/` | Equipos | Historial del equipo y administración de equipos |
| `features/laboratories/` | Laboratorios | Administración de laboratorios |
| `features/catalog/` | Catálogo | Catálogo de tipos de equipo |
| `features/users/` | Usuarios | Administración de usuarios |
| `features/profile/` | Perfil | Mi perfil (cambio de contraseña) |
| `features/reports/` | Reportes | Reportes por periodo |
| `components/ui/` | Interfaz | Piezas genéricas: `Button` (botón), `Table` (tabla), `Select` (lista desplegable), `Badge` (etiqueta de color), `Modal` (ventana)… |
| `components/layout/` | Diseño de página | Barra lateral (`Sidebar`), barra superior (`Topbar`) y la protección de rutas (`RequireAuth`, `RequireAdmin`) |
| `lib/` | Utilidades | `apiClient.ts` (habla con el backend) y formatos de fechas, números y duraciones |
| `types/` | Tipos | La forma de cada tabla, con los mismos nombres de la base de datos |
| `app/` | Aplicación | El router (qué pantalla va en cada dirección) |

Cada módulo de `features/` tiene la misma forma: `pages/` (pantallas), `components/` (piezas propias), `api.ts`
(pide los datos) y `use….ts` (hooks).

---

## 6. La base de datos

Las 14 tablas están en `docs/NEXOLAB_BD_v4.dbml`. El **prefijo** de cada nombre indica su tipo:

| Prefijo | Significa | Tablas |
|---|---|---|
| `cat_` | **Catálogo**: listas que casi no cambian | roles, tipos de equipo, estados del equipo, componentes, estados de incidencia, acciones de cierre, niveles de riesgo |
| `mst_` | **Maestra**: los datos principales | usuarios, laboratorios, equipos |
| `trx_` | **Transaccional**: lo que pasa día a día | incidencias |
| `hst_` | **Histórica**: lo que deja cada cálculo del modelo | ejecuciones de K-Means, centroides (perfil de cada grupo), resultado de riesgo de cada equipo |

Todas tienen `is_active` (si el registro es válido), `created_at` (cuándo se creó) y `updated_at` (cuándo se
modificó). Además, Django crea unas tablas propias para funcionar (sesiones y permisos internos).

---

## 7. El modelo K-Means, paso a paso

1. **Qué equipos entran:** los vigentes, de un tipo seleccionado en el catálogo.
2. **Regla RN-23:** un equipo con menos de 2 incidencias queda en riesgo **bajo** ("sin historial suficiente").
3. **Las 3 variables** de cada equipo: cuántas veces falló, hace cuántos días falló por última vez y cada cuántos
   días falla en promedio.
4. **Agrupar:** K-Means forma 3 grupos de equipos con valores parecidos. El grupo con más fallas, más recientes y
   más seguidas es **alto**.
5. **Qué datos usa para aprender:**
   - Al inicio, el **dataset de Kaggle** (2 519 incidencias reales de 142 equipos de TI con 2 o más fallas).
   - Cuando el laboratorio tiene **30 equipos con historial propio**, aprende de **sus propios datos** (D-33).
     El número se puede cambiar en `backend/.env` (`RISK_MIN_OWN_HISTORY_DEVICES`).
6. **Cuándo se ejecuta:** al cargar los datos, con el botón "Recalcular ahora", al cerrar o anular una incidencia y
   al cambiar el catálogo.
7. **Trazabilidad:** cada ejecución queda guardada con sus métricas (silueta, Davies-Bouldin), el origen de los
   datos y el modelo usado.

---

## 8. Seguridad

- Las contraseñas se guardan con **hash** (cifradas de forma que no se pueden leer).
- La sesión vive en una **cookie que JavaScript no puede leer** y hay protección **CSRF**.
- El login da el mismo mensaje si el correo no existe o si la contraseña está mal (RN-01).
- Cada endpoint revisa los permisos en el backend (RN-06).
- Quien registra o cierra una incidencia se toma de la sesión, nunca del formulario (RN-15).
- No hay contraseñas en el código: todo está en archivos `.env`, que no se suben a GitHub.

---

## 9. Calidad

| Qué | Comando | Resultado esperado |
|---|---|---|
| Pruebas del backend | `python manage.py test apps` | 90 pruebas, todas OK |
| Revisión del código del frontend | `npm run lint` | Sin errores |
| Versión final del frontend | `npm run build` | Termina sin errores |

---

## 10. Dónde está cada cosa

| Necesito… | Archivo |
|---|---|
| Arrancar el sistema | [README.md](../README.md) |
| Presentar el sistema | [GUION_DEMOSTRACION.md](GUION_DEMOSTRACION.md) |
| Saber por qué se decidió algo | Sección 17 de [CONTEXTO_DESARROLLO.md](CONTEXTO_DESARROLLO.md) (D-01 a D-43) |
| Las reglas de negocio | Sección 9 de `CONTEXTO_DESARROLLO.md` (RN-01 a RN-23) |
| El modelo K-Means en detalle | Sección 10 de `CONTEXTO_DESARROLLO.md` |
| Las tablas | [NEXOLAB_BD_v4.dbml](NEXOLAB_BD_v4.dbml) |
| Los endpoints | [backend/README.md](../backend/README.md) |
