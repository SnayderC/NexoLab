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

Carga los catálogos, los 3 usuarios, los 5 laboratorios y los 145 equipos (142 activos y 3 retirados),
con los mismos identificadores que `frontend/src/mocks/`. Las incidencias y los resultados de K-Means
se cargarán cuando se programen sus API (fases 5 y 6).

## Endpoints disponibles

Base: `/api/v1/`. Autenticación por sesión de Django (cookie `sessionid`, `httpOnly`) con protección CSRF.

| Método y ruta | Acceso | Respuesta |
|---|---|---|
| `GET auth/csrf` | Público | 204 y la cookie `csrftoken` |
| `POST auth/login` | Público | 200 con el usuario · 400 credenciales incorrectas · 403 cuenta desactivada |
| `POST auth/logout` | Con sesión | 204 |
| `GET auth/me` | Con sesión | 200 con el usuario · 403 sin sesión |
| `POST auth/change-password` | Con sesión | 204 · 400 con los mensajes de validación |
| `GET users` | Administrador | 200 con la lista de usuarios · 403 técnico |

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

## Pruebas

```bash
.venv/bin/python manage.py test apps
```

`apps/users/tests.py` cubre el login, el CSRF, la sesión, el cierre de sesión, el cambio de contraseña
y el permiso de administrador (16 pruebas).
