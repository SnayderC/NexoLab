# NexoLab

Aplicativo web de gestión de incidencias con agrupamiento de riesgo de equipos (K-Means) para los
laboratorios del Bloque H. Proyecto de titulación, UNEMI.

- `frontend/`: React 19 + TypeScript + Vite 8 + Tailwind 4 ([frontend/README.md](frontend/README.md)).
- `backend/`: Django 5.2 LTS + Django REST Framework ([backend/README.md](backend/README.md)).
- Base de datos: PostgreSQL 17 en Docker (`docker-compose.yml`).
- Explicación del proyecto en español (arquitectura y glosario): [docs/GUIA_DEL_PROYECTO.md](docs/GUIA_DEL_PROYECTO.md).
- Guion para presentar el sistema: [docs/GUION_DEMOSTRACION.md](docs/GUION_DEMOSTRACION.md).
- Documentación del desarrollo y decisiones: [docs/CONTEXTO_DESARROLLO.md](docs/CONTEXTO_DESARROLLO.md).

## Requisitos

- Docker con Docker Compose.
- Python 3.12 o superior (el desarrollo usa 3.14).
- Node.js 22 LTS o superior.

## Opción A: todo con Docker (un solo comando)

Solo necesitas Docker. Los comandos se ejecutan desde la raíz del repositorio.

```bash
cp .env.example .env                  # escribe una contraseña en POSTGRES_PASSWORD
cp backend/.env.example backend/.env  # completa SECRET_KEY y DEMO_PASSWORD (DATABASE_URL lo pone Docker)
docker compose --profile app up -d --build   # base de datos, backend, frontend, Redis y Celery (worker y beat)
docker compose exec backend python manage.py seed_demo   # solo la primera vez: datos de demostración
```

Abre http://localhost:5173. Las migraciones se aplican solas al arrancar el backend. El *worker* de Celery calcula el
riesgo en segundo plano y Celery Beat lo recalcula cada 15 minutos (D-55); sus mensajes se ven con
`docker compose logs -f worker beat`.

| Para… | Comando |
|---|---|
| Ver si los servicios están corriendo | `docker compose --profile app ps` |
| Ver los mensajes del backend | `docker compose logs -f backend` |
| Volver a los datos de demostración | `docker compose exec backend python manage.py seed_demo --reset` |
| Recalcular el riesgo | `docker compose exec backend python manage.py recalculate_risk` |
| Ejecutar las pruebas del backend | `docker compose exec backend python manage.py test apps` |
| Ejecutar las pruebas del frontend | `cd frontend && npm test` |
| Apagar todo (los datos se conservan) | `docker compose --profile app down` |
| Respaldar la base de datos | `sh scripts/respaldar.sh` (crea `respaldos/nexolab_AAAAMMDD_HHMM.sql`) |
| Restaurar un respaldo (reemplaza todos los datos) | `sh scripts/restaurar.sh respaldos/<archivo>.sql` |
| Medir el rendimiento (RNF03) | `NEXOLAB_PASSWORD=<DEMO_PASSWORD> python3 scripts/medir_rendimiento.py` |
| Analizar el número de grupos k (codo y silueta) | `docker compose exec backend python manage.py analizar_k --salida /app/_k` (los archivos quedan en `backend/_k/`) |
| Ver el trabajo en segundo plano (Celery) | `docker compose logs -f worker beat` |

Los cambios en el código se recargan solos. Si cambias `requirements.txt` o `package.json`, vuelve a ejecutar
`docker compose --profile app up -d --build`. Antes de usar esta opción, apaga el `runserver` y el `npm run dev`
de la opción B, porque usan los mismos puertos (8000 y 5173).

## Opción B: cada parte por separado (desarrollo)

Los comandos se ejecutan desde la raíz del repositorio. `docker compose up -d` (sin `--profile app`) levanta solo
la base de datos.

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
# Sin REDIS_URL, el riesgo se calcula en el momento en lugar de en segundo plano (D-55).
# Para probar Celery en esta opción: docker compose --profile app up -d redis, agrega
# REDIS_URL=redis://localhost:6380/0 a .env y ejecuta en otras terminales
# .venv/bin/celery -A config worker -l info   y   .venv/bin/celery -A config beat -l info
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
| Interfaz de las 6 páginas del Figma | Lista |
| Base de datos (15 tablas del modelo v4.1) | Lista, con migraciones |
| Inicio de sesión, sesión, cierre de sesión y cambio de contraseña | Conectados a la API real |
| Todas las pantallas (dashboard, incidencias, reportes, equipos, laboratorios, catálogo, usuarios, perfil) | Conectadas a la API real |
| Modelo K-Means (carga inicial con Kaggle; recálculo manual, al cerrar incidencias y al cambiar el catálogo) | Listo |
| Docker Compose con base de datos, backend y frontend (perfil `app`) | Listo |
| Modo técnico, límite de intentos de login, sesión vencida, respaldos y bitácora | Listos |
| K-Means en segundo plano con Celery y Redis, recálculo cada 15 minutos | Listo |
| Anular equipo registrado por error y análisis de k (codo y silueta) | Listos |
| Adaptación a tablet (768 a 1439 px) | Lista |
| Pruebas: 111 del backend y 19 del frontend | Pasan |
| Documentación final y guion de la demostración (fase 8) | Listo |

El detalle de cada fase está en la sección 15 de `docs/CONTEXTO_DESARROLLO.md`.

## Verificación antes de un commit

```bash
cd backend && .venv/bin/python manage.py check && .venv/bin/python manage.py test apps
cd frontend && npm run lint && npm test && npm run build
```
