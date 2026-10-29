# NexoLab — Backend

API REST de NexoLab con Django 5.2 LTS, Django REST Framework y PostgreSQL 17.
La puesta en marcha completa está en el [README de la raíz](../README.md).

## Estructura

```
backend/
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

## Datos de demostración

```bash
.venv/bin/python manage.py seed_demo          # falla si ya hay datos, para no duplicarlos
.venv/bin/python manage.py seed_demo --reset  # borra los datos de las tablas del modelo y vuelve a cargarlos
```

Carga los catálogos, los 3 usuarios, los 5 laboratorios, los 145 equipos (142 activos y 3 retirados) y
las 33 incidencias (7 abiertas), con los mismos identificadores que `frontend/src/mocks/`. Los resultados
de K-Means se cargarán cuando se programe el modelo (fase 6).

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

## Pruebas

```bash
.venv/bin/python manage.py test apps
```

- `apps/users/tests.py` (25): login, CSRF, sesión, cierre de sesión, cambio de contraseña, permiso de administrador
  y administración de usuarios.
- `apps/infrastructure/tests.py` (13): laboratorios, sus validaciones, RN-06 y RN-10.
