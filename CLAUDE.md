# NexoLab — Instrucciones para Claude Code

Proyecto de titulación (UNEMI): aplicativo web de gestión de incidencias con clustering
de riesgo de equipos (K-Means) para los laboratorios del Bloque H.

## Fuente de verdad
Antes de cada tarea, consulta las secciones relevantes de `docs/CONTEXTO_DESARROLLO.md`.
- Modelo de datos aprobado: `docs/NEXOLAB_BD_v4.dbml` (no se cambia sin consultarme).
- Datos de demostración: parte 3 de `docs/PROMPT_FIGMA_MAKE_NEXOLAB.md`.
- Diseño aprobado: archivo de Figma "Nexolab — Prototipo 1.0", páginas 01 a 06.
  No uses la página 00 ni implementes "Ver como técnico" ni "Simular error de carga".

## Estado actual
- Interfaz de las páginas 01 a 06 lista con datos de demostración.
- Backend creado: modelos v4, `seed_demo` y autenticación (fase 3) con pruebas.
- Login, sesión y cambio de contraseña del frontend ya usan la API real; el resto de `api.ts` sigue en `src/mocks/`.
- Siguiente: API de administración (fase 4) e incidencias (fase 5). Cómo arrancar todo: `README.md`.
- Orden acordado: interfaz con datos de demostración → backend → conectar ambos.

## Stack
- Frontend (`frontend/`): React 19 + TypeScript + Vite 8 + Tailwind 4 + React Router.
- Backend (`backend/`, más adelante): Django 5.2 LTS + DRF + PostgreSQL 17.

## Reglas
- Código en inglés; textos visibles en español (Ecuador). Rutas de la interfaz en español.
- Solo tokens de Tailwind definidos en `frontend/src/index.css`. Nunca colores hexadecimales en componentes.
- Estructura: `src/features/<módulo>/{pages,components,api.ts}`; componentes genéricos en `src/components/ui`; layout en `src/components/layout`.
- Los datos nunca se escriben dentro de un componente: vienen de `api.ts`, que por ahora lee `src/mocks/`.
- Tipos en `src/types/` con nombres en snake_case, iguales a la base de datos.
- No instales dependencias que no estén en la sección 4 de `docs/CONTEXTO_DESARROLLO.md` sin preguntarme.
- Nunca pongas credenciales en el código; usa variables de entorno.

## Forma de trabajar
- Estoy aprendiendo: antes de cambios grandes, muéstrame un plan breve y espera mi confirmación.
- Explica brevemente las decisiones importantes.
- Haz cambios pequeños, una tarea a la vez.
- Al terminar, ejecuta `npm run lint` y `npm run build` dentro de `frontend/` y dime el resultado.