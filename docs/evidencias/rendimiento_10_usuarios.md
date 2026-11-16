# Medición de rendimiento (RNF03) — 16/11/2026 09:44

- **Escenario:** 10 usuarios a la vez, 20 rondas cada uno, 9 consultas por ronda (1800 solicitudes en 32.4 s).
- **Entorno:** Linux 7.2.4-arch1-2, 12 núcleos; Docker Compose local; peticiones a http://localhost:5173 (pasan por el proxy de Vite, como desde el navegador).
- **Resultado:** 100.0 % de las solicitudes respondió en ≤ 3 s (meta: 95 %). Errores: 0. **Cumple.**

| Consulta | Solicitudes | Mediana | Percentil 95 | Máximo |
|---|---|---|---|---|
| Dashboard | 200 | 370 ms | 521 ms | 584 ms |
| Lista de incidencias | 200 | 131 ms | 241 ms | 319 ms |
| Incidencias cerradas | 200 | 138 ms | 248 ms | 339 ms |
| Historial del equipo | 200 | 113 ms | 187 ms | 262 ms |
| Incidencias del equipo | 200 | 115 ms | 201 ms | 270 ms |
| Equipos para registrar | 200 | 82 ms | 167 ms | 239 ms |
| Catálogos | 200 | 119 ms | 209 ms | 250 ms |
| Laboratorios | 200 | 102 ms | 179 ms | 235 ms |
| Reportes (6 meses) | 200 | 337 ms | 504 ms | 658 ms |
| **Todas** | 1800 | 133 ms | 427 ms | 658 ms |
