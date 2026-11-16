# NexoLab — Instrucciones para Claude Code

Proyecto de titulación (UNEMI): aplicativo web de gestión de incidencias con clustering
de riesgo de equipos (K-Means) para los laboratorios del Bloque H.

## Fuente de verdad
Antes de cada tarea, consulta las secciones relevantes de `docs/CONTEXTO_DESARROLLO.md`.
- Modelo de datos aprobado: `docs/NEXOLAB_BD_v4.dbml` (no se cambia sin consultarme).
- Datos de demostración: parte 3 de `docs/PROMPT_FIGMA_MAKE_NEXOLAB.md`.
- Diseño aprobado: archivo de Figma "Nexolab — Prototipo 1.0", páginas 01 a 06.
  No uses la página 00 ni implementes "Simular error de carga". "Ver como técnico" se reemplazó por el
  modo técnico real del administrador (D-45, pedido en la revisión del 12/11/2026).

## Estado actual
- Fases 0 a 7 terminadas: todas las pantallas (Figma 01 a 06) usan la API real; `src/mocks/` ya no existe.
- Backend: autenticación, administración, incidencias, reportes y modelo K-Means (con Kaggle), con 97 pruebas.
- Fase 9 (revisión del 12/11/2026): modo técnico del administrador (RN-24, D-45) y "Solución aplicada" al cerrar (D-44).
- Fase 10 (16/11/2026): límite de intentos de login (RN-25), aviso de sesión vencida (D-47), respaldos con `scripts/` (D-48); se quitó `features/dev` (D-49); RNF03 medido con `scripts/medir_rendimiento.py` (D-50). Falta aplicar la ficha de usabilidad (`docs/evidencias/`).
- Documento para quien redacta la tesis: `docs/DOCUMENTO_PARA_TESIS.md`.
- Los datos de demostración (Bloque H de ejemplo: 10 laboratorios, 432 equipos, 325 incidencias) se cargan con `python manage.py seed_demo` (D-42).
- Docker Compose completo: `docker compose --profile app up -d` (D-41).
- Fase 8 terminada: guía en español (`docs/GUIA_DEL_PROYECTO.md`) y guion (`docs/GUION_DEMOSTRACION.md`).
- Pendiente: lo de la sección 18 de `docs/CONTEXTO_DESARROLLO.md`. Cómo arrancar todo: `README.md`.

## Stack
- Frontend (`frontend/`): React 19 + TypeScript + Vite 8 + Tailwind 4 + React Router.
- Backend (`backend/`): Django 5.2 LTS + DRF + PostgreSQL 17 + scikit-learn (K-Means).

## Reglas
- Código en inglés; textos visibles en español (Ecuador). Rutas de la interfaz en español.
- Solo tokens de Tailwind definidos en `frontend/src/index.css`. Nunca colores hexadecimales en componentes.
- Estructura: `src/features/<módulo>/{pages,components,api.ts}`; componentes genéricos en `src/components/ui`; layout en `src/components/layout`.
- Los datos nunca se escriben dentro de un componente: vienen de `api.ts`, que llama a la API (`src/lib/apiClient.ts`).
- Tipos en `src/types/` con nombres en snake_case, iguales a la base de datos.
- No instales dependencias que no estén en la sección 4 de `docs/CONTEXTO_DESARROLLO.md` sin preguntarme.
- Nunca pongas credenciales en el código; usa variables de entorno.

## Forma de trabajar
- Estoy aprendiendo: antes de cambios grandes, muéstrame un plan breve y espera mi confirmación.
- Explica brevemente las decisiones importantes.
- Haz cambios pequeños, una tarea a la vez.
- Al terminar, ejecuta `npm run lint` y `npm run build` dentro de `frontend/` y dime el resultado.