# NexoLab — Backend

API REST de NexoLab con Django 5.2 LTS, Django REST Framework y PostgreSQL 17.
La puesta en marcha completa está en el [README de la raíz](../README.md).

## Estructura

```
backend/
├── data/                   # ITSM_data.csv: dataset de Kaggle para la carga inicial de K-Means
├── config/                 # settings.py (lee .env) y urls.py (prefijo /api/v1/)
└── apps/
    ├── core/               # BaseModel (is_active, created_at, updated_at) y el comando seed_demo
    ├── users/              # cat_roles, mst_users, autenticación y permisos
    ├── infrastructure/     # cat_device_types, cat_device_statuses, mst_laboratories, mst_devices
    ├── incidents/          # cat_components, cat_incident_statuses, cat_resolution_actions, trx_incidents
    └── risk/               # cat_risk_levels y las tablas hst_ de K-Means
```

Los modelos replican `docs/NEXOLAB_BD_v4.dbml`: mismos nombres de tablas y columnas (`db_table`, `db_column`).
Además de las 14 tablas del modelo, Django crea sus tablas internas (`django_session`,
`django_migrations`, `django_content_type`, `auth_permission`, `auth_group`); no forman parte del modelo de datos.

## Variables de entorno (`backend/.env`)

| Variable | Uso |
|---|---|
| `SECRET_KEY` | Clave de Django. Se genera con el comando que indica `.env.example` |
| `DEBUG` | `True` en desarrollo. Con `False`, las cookies solo viajan por HTTPS |
| `DATABASE_URL` | Conexión a PostgreSQL (`postgres://usuario:clave@localhost:5433/nexolab`) |
| `DEMO_PASSWORD` | Contraseña de los usuarios que crea `seed_demo` |
| `ALLOWED_HOSTS` | Opcional. Por defecto `localhost,127.0.0.1` |
| `CSRF_TRUSTED_ORIGINS` | Opcional. Por defecto `http://localhost:5173` |
| `RISK_MIN_OWN_HISTORY_DEVICES` | Opcional. Equipos con historial propio para dejar de usar el modelo de Kaggle. Por defecto 30 (D-33) |

## Datos de demostración

```bash
.venv/bin/python manage.py seed_demo          # falla si ya hay datos, para no duplicarlos
.venv/bin/python manage.py seed_demo --reset  # borra los datos de las tablas del modelo y vuelve a cargarlos
```

Carga los catálogos, los 3 usuarios, los 5 laboratorios, los 145 equipos (142 activos y 3 retirados) y
las 33 incidencias (7 abiertas) del prototipo. Al final ejecuta
la carga inicial de K-Means, así el riesgo de cada equipo sale de las incidencias guardadas.

## Modelo de riesgo (K-Means)

```bash
.venv/bin/python manage.py recalculate_risk --initial  # carga inicial: entrena con data/ITSM_data.csv (Kaggle)
.venv/bin/python manage.py recalculate_risk            # recálculo manual con los datos actuales
```

El código está en `apps/risk/`: `kmeans.py` (variables, entrenamiento y niveles), `kaggle.py` (lectura y filtro del
dataset) y `services.py` (elige el modelo y guarda la ejecución, los centroides y un resultado por equipo en una sola
transacción). Cada ejecución queda en `hst_kmeans_runs` con sus métricas, el origen de los datos y el modelo usado.
El detalle está en la sección 10 de `docs/CONTEXTO_DESARROLLO.md`.

## Endpoints disponibles

Base: `/api/v1/`. Autenticación por sesión de Django (cookie `sessionid`, `httpOnly`) con protección CSRF.

| Método y ruta | Acceso | Respuesta |
|---|---|---|
| `GET auth/csrf` | Público | 204 y la cookie `csrftoken` |
| `POST auth/login` | Público | 200 con el usuario · 400 credenciales incorrectas · 403 cuenta desactivada |
| `POST auth/logout` | Con sesión | 204 |
| `GET auth/me` | Con sesión | 200 con el usuario · 403 sin sesión |
| `POST auth/change-password` | Con sesión | 204 · 400 con los mensajes de validación |
| `GET users` | Administrador | 200 con cada usuario, su rol, laboratorios a cargo y carga de trabajo · 403 técnico |
| `POST users` | Administrador | 201 · 400 (correo duplicado, `temporary_password` débil) |
| `PATCH users/{id}` | Administrador | 200 · 400. No cambia la contraseña |
| `POST users/{id}/activate` · `deactivate` | Administrador | 200 · 409 `{code: "self_deactivation"}` si es la propia cuenta |
| `POST users/{id}/reset-password` | Administrador | 204 · 400 con los mensajes de `new_password` |
| `GET catalogs` | Con sesión | 200 con roles, estados, componentes, acciones de cierre y niveles de riesgo |
| `GET device-types` | Con sesión | 200 con los tipos, si están seleccionados y sus equipos activos |
| `POST device-types` | Administrador | 201 sin seleccionar (RN-09) · 400 código de 2 a 5 letras (D-37) o duplicado |
| `PUT device-types/selection` | Administrador | 200 `{selected_ids, risk_error}`; recalcula el riesgo (`CATALOG_CHANGE`) · 400 sin tipos (RN-07) |
| `GET incidents` | Con sesión | 200 `{items, total, counts, now}`; filtros `status`, `search`, `laboratory_id`, `priority`, `from`, `to`, `page` |
| `POST incidents` | Con sesión | 201 con la incidencia y su número (RN-14) · 400 (RN-13, RN-16, D-24) |
| `GET incidents/{número}` | Con sesión | 200 · 404 (las anuladas no se muestran) |
| `POST incidents/{número}/close` | Con sesión | 200 con `retired_device_code` (RN-19) · 400 (RN-17) · 409 ya cerrada (RN-21). Recalcula el riesgo (`INCIDENT_CLOSED`) |
| `POST incidents/{número}/void` | Administrador | 204 (RN-22). Recalcula el riesgo (`MANUAL`, D-39) |
| `GET devices/eligible` | Con sesión | 200 con los equipos que admiten incidencias (RN-13), por `laboratory_id` o `code` |
| `GET devices` | Con sesión | 200 `{items, total}` con riesgo vigente; filtros `search`, `laboratory_id`, `device_type_id`, `status`, `risk_level` y `page` (10 por página) |
| `POST devices` | Administrador | 201 · 400 (formato RN-11, prefijo D-21, duplicado, laboratorio inactivo, tipo no seleccionado) |
| `PATCH devices/{id}` | Administrador | 200 · 400. Ubicación, especificaciones y `status = RETIRED` (RN-12); un retirado no vuelve a activo |
| `GET devices/{code}` | Con sesión | 200 con datos, retiro, riesgo vigente, perfil del grupo y evolución mensual · 404 |
| `GET devices/{code}/incidents` | Con sesión | 200 `{items, total, now}`, 10 por página |
| `GET dashboard/summary` | Con sesión | 200 con indicadores, última ejecución, grupos de riesgo e incidencias abiertas; filtros `laboratory_id` y `device_type_id` |
| `POST risk/recalculate` | Administrador | 200 con la ejecución y los equipos por nivel · 409 `{code: "risk_failed"}` si el cálculo falla |
| `GET laboratories` | Con sesión | 200 con cada laboratorio, su responsable, equipos activos, composición por tipo (`device_counts`) e incidencias abiertas |
| `POST laboratories` | Administrador | 201 con el laboratorio · 400 con los mensajes por campo |
| `PATCH laboratories/{id}` | Administrador | 200 · 400 · 409 si se desactiva con incidencias abiertas |
| `POST laboratories/{id}/activate` · `deactivate` | Administrador | 200 · 409 `{code: "has_open_incidents", open_incident_count}` |

Toda petición que no sea `GET` debe enviar la cabecera `X-CSRFToken` con el valor de la cookie `csrftoken`
(el frontend lo hace en `src/lib/apiClient.ts`).

### Reglas aplicadas

- **RN-01 / D-10:** correo inexistente y contraseña incorrecta devuelven el mismo mensaje
  ("Correo o contraseña incorrectos"). Con un correo inexistente igual se calcula un hash, para que el
  tiempo de respuesta no revele qué correos existen.
- **RN-02:** "Tu cuenta está desactivada" solo se muestra si la contraseña es correcta.
- **Contraseñas:** mínimo 8 caracteres y los validadores de Django (no muy común, no solo números,
  no parecida a los datos del usuario). Se guardan con hash en `password_hash`.
- **Cambio de contraseña:** exige la contraseña actual y mantiene la sesión abierta.
- **RN-06:** las rutas de administración usan el permiso `IsAdmin` (`apps/users/permissions.py`).
- **Usuarios (RN-03 a RN-05):** el administrador crea usuarios con una contraseña temporal y la restablece;
  ambas pasan los validadores de Django. El correo se guarda en minúsculas y no se repite. Nadie puede
  desactivar su propia cuenta. Un usuario desactivado pierde también su sesión abierta. La carga de trabajo
  cuenta las incidencias registradas y cerradas, sin las anuladas.
- **Laboratorios:** el código se guarda en mayúsculas y es único sin distinguir mayúsculas
  ("Ya existe un laboratorio con el código H101"); los puestos son al menos 1; el responsable debe ser un
  técnico activo (se puede conservar el actual aunque ya no lo sea).
- **RN-10:** no se desactiva un laboratorio con incidencias abiertas, ni con el botón ni desde el formulario (409).
  Las incidencias anuladas (`is_active = false`) no cuentan.
- **Incidencias (RN-13 a RN-22):** solo en equipos que admiten incidencias; número `INC-AAAA-NNNN` correlativo por
  año (con un candado de PostgreSQL para no repetirlo); quien registra y cierra es siempre el usuario de la sesión;
  descripción y diagnóstico de 10 a 500 caracteres (20 con el componente "Otro"); fechas no futuras y cierre no
  anterior a la falla; tiempo de atención calculado por el backend; "Requiere reemplazo" retira el equipo en la misma
  transacción; una cerrada no se modifica. Al confirmar el cierre se recalcula el riesgo; si el modelo falla, el
  cierre se mantiene y la ejecución queda como FAILED.

## Pruebas

```bash
.venv/bin/python manage.py test apps
```

- `apps/users/tests.py` (25): login, CSRF, sesión, cierre de sesión, cambio de contraseña, permiso de administrador
  y administración de usuarios.
- `apps/infrastructure/tests.py` (21): laboratorios (RN-10) y equipos (RN-07, RN-11, RN-12, D-21), con RN-06.
- `apps/risk/tests.py` (20): variables, algoritmo, RN-23, carga inicial con Kaggle, reuso del modelo, recálculo y dashboard.
- `apps/incidents/tests.py` (18): registrar, listar, cerrar, retiro, numeración, recálculo al cerrar, anular y catálogo de tipos.
