# NexoLab

Aplicativo web de gestión de incidencias con agrupamiento de riesgo de equipos (K-Means) para los
laboratorios del Bloque H. Proyecto de titulación, UNEMI.

- `frontend/`: React 19 + TypeScript + Vite 8 + Tailwind 4 ([frontend/README.md](frontend/README.md)).
- `backend/`: Django 5.2 LTS + Django REST Framework ([backend/README.md](backend/README.md)).
- Base de datos: PostgreSQL 17 en Docker (`docker-compose.yml`).
- Documentación del desarrollo: [docs/CONTEXTO_DESARROLLO.md](docs/CONTEXTO_DESARROLLO.md).

## Requisitos

- Docker con Docker Compose.
- Python 3.12 o superior (el desarrollo usa 3.14).
- Node.js 22 LTS o superior.

## Puesta en marcha (desarrollo)

Los comandos se ejecutan desde la raíz del repositorio.

### 1. Base de datos

```bash
cp .env.example .env          # escribe una contraseña en POSTGRES_PASSWORD
docker compose up -d          # PostgreSQL 17 queda en localhost:5433
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env          # completa SECRET_KEY, DATABASE_URL y DEMO_PASSWORD
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed_demo
.venv/bin/python manage.py runserver   # API en http://localhost:8000/api/v1/
```

En Windows, cambia `.venv/bin/` por `.venv\Scripts\`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

Vite reenvía las peticiones a `/api` hacia Django, así que el backend debe estar corriendo.

### Usuarios de demostración

Los crea `seed_demo`. Todos usan la contraseña definida en `DEMO_PASSWORD` (`backend/.env`).

| Correo | Rol | Estado |
|---|---|---|
| andrea.villacis@gmail.com | Administradora | Activa |
| carlos.mendoza@gmail.com | Técnico | Activo |
| luis.bravo@gmail.com | Técnico | Inactivo (sirve para probar el aviso de cuenta desactivada) |

## Estado

| Parte | Estado |
|---|---|
| Interfaz de las 6 páginas del Figma | Lista, con datos de demostración |
| Base de datos (14 tablas del modelo v4) | Lista, con migraciones |
| Inicio de sesión, sesión, cierre de sesión y cambio de contraseña | Conectados a la API real |
| Dashboard, equipos (lista, historial y administración), laboratorios y usuarios | Conectados a la API real |
| Catálogo de tipos e incidencias (lista, registrar, cerrar) | Interfaz con datos de demostración; API pendiente |
| Modelo K-Means (carga inicial con Kaggle y recálculo) | Listo; el Dashboard y el historial muestran su resultado |

El detalle de cada fase está en la sección 15 de `docs/CONTEXTO_DESARROLLO.md`.

## Verificación antes de un commit

```bash
cd backend && .venv/bin/python manage.py check && .venv/bin/python manage.py test apps
cd frontend && npm run lint && npm run build
```
