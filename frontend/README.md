# NexoLab — Frontend

Interfaz de NexoLab con React 19, TypeScript, Vite 8 y Tailwind 4. Replica el Figma
"Nexolab — Prototipo 1.0" (páginas 01 a 06). La puesta en marcha está en el [README de la raíz](../README.md).

## Comandos

```bash
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run lint     # ESLint
npm run build    # verificación de tipos y build de producción en dist/
```

## Cómo se obtienen los datos

- Cada módulo de `src/features/<módulo>/` pide sus datos solo a través de su `api.ts`.
- **Con la API real** de Django (mediante `src/lib/apiClient.ts`): autenticación (`features/auth`) y
  laboratorios (`features/laboratories`).
- **Resto de módulos:** todavía leen `src/mocks/` (datos de demostración). Se cambiarán a la API real
  cuando el backend tenga esos endpoints (fase 7).

En desarrollo, Vite reenvía `/api` a `http://localhost:8000` (`vite.config.ts`). Así la aplicación y la API
comparten el mismo origen y la cookie de sesión funciona sin configurar CORS (decisión D-25).
