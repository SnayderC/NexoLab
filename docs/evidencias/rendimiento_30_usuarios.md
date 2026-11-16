# Medición de rendimiento (RNF03) — 16/11/2026 09:45

- **Escenario:** 30 usuarios a la vez, 10 rondas cada uno, 9 consultas por ronda (2700 solicitudes en 52.1 s).
- **Entorno:** Linux 7.2.4-arch1-2, 12 núcleos; Docker Compose local; peticiones a http://localhost:5173 (pasan por el proxy de Vite, como desde el navegador).
- **Resultado:** 100.0 % de las solicitudes respondió en ≤ 3 s (meta: 95 %). Errores: 0. **Cumple.**

| Consulta | Solicitudes | Mediana | Percentil 95 | Máximo |
|---|---|---|---|---|
| Dashboard | 300 | 975 ms | 1281 ms | 2405 ms |
| Lista de incidencias | 300 | 451 ms | 674 ms | 1600 ms |
| Incidencias cerradas | 300 | 458 ms | 667 ms | 1767 ms |
| Historial del equipo | 300 | 378 ms | 606 ms | 1494 ms |
| Incidencias del equipo | 300 | 381 ms | 610 ms | 1620 ms |
| Equipos para registrar | 300 | 317 ms | 545 ms | 1482 ms |
| Catálogos | 300 | 456 ms | 724 ms | 1667 ms |
| Laboratorios | 300 | 337 ms | 535 ms | 1510 ms |
| Reportes (6 meses) | 300 | 1020 ms | 1362 ms | 2038 ms |
| **Todas** | 2700 | 440 ms | 1171 ms | 2405 ms |
