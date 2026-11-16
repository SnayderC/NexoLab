"""
Medición de rendimiento de NexoLab (RNF03, D-50). Solo usa la biblioteca estándar de Python: no instala nada.

Simula varios usuarios a la vez que inician sesión y hacen las consultas habituales (dashboard, lista de
incidencias, historial de un equipo, reportes…), pasando por el frontend como un navegador. Solo hace consultas
(GET): no cambia datos.

Uso, con el sistema levantado (docker compose --profile app up -d), desde la raíz del proyecto:

    NEXOLAB_EMAIL=carlos.mendoza@gmail.com NEXOLAB_PASSWORD=... python3 scripts/medir_rendimiento.py

Opciones: --usuarios 10 --rondas 20 --url http://localhost:5173 --salida resultado.md
La contraseña se lee de una variable de entorno: nunca se escribe en el código.
"""

import argparse
import http.cookiejar
import json
import os
import platform
import statistics
import sys
import threading
import time
import urllib.error
import urllib.request
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

LIMIT_SECONDS = 3.0  # RNF03: tiempo máximo por solicitud
TARGET_PERCENT = 95.0  # RNF03: porcentaje que debe cumplirlo

# Consultas habituales de un técnico durante su trabajo (las pantallas principales).
OPERATIONS = [
    ('Dashboard', '/api/v1/dashboard/summary'),
    ('Lista de incidencias', '/api/v1/incidents?status=OPEN&page=1'),
    ('Incidencias cerradas', '/api/v1/incidents?status=CLOSED&page=2'),
    ('Historial del equipo', '/api/v1/devices/H107-PC-08'),
    ('Incidencias del equipo', '/api/v1/devices/H107-PC-08/incidents?page=1'),
    ('Equipos para registrar', '/api/v1/devices/eligible?laboratory_id=1'),
    ('Catálogos', '/api/v1/catalogs'),
    ('Laboratorios', '/api/v1/laboratories'),
    ('Reportes (6 meses)', '/api/v1/reports/summary?from=2026-05-01&to=2026-10-31'),
]


class Session:
    """Un usuario con su propia cookie de sesión, como un navegador."""

    def __init__(self, base_url):
        self.base_url = base_url
        self.cookies = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.cookies))

    def _csrf(self):
        return next((c.value for c in self.cookies if c.name == 'csrftoken'), '')

    def request(self, path, body=None):
        headers = {'Accept': 'application/json'}
        data = None
        if body is not None:
            headers.update({'Content-Type': 'application/json', 'X-CSRFToken': self._csrf()})
            data = json.dumps(body).encode()
        req = urllib.request.Request(self.base_url + path, data=data, headers=headers)
        start = time.perf_counter()
        try:
            with self.opener.open(req, timeout=30) as response:
                response.read()
                status = response.status
        except urllib.error.HTTPError as error:
            status = error.code
        return status, time.perf_counter() - start

    def login(self, email, password):
        self.request('/api/v1/auth/csrf')
        status, _ = self.request('/api/v1/auth/login', {'email': email, 'password': password})
        if status != 200:
            raise SystemExit(f'No se pudo iniciar sesión (HTTP {status}). Revisa NEXOLAB_EMAIL y NEXOLAB_PASSWORD.')


def run_user(base_url, email, password, rounds, results, lock):
    session = Session(base_url)
    status, seconds = session.request('/api/v1/auth/csrf')
    session.login(email, password)
    for _ in range(rounds):
        for name, path in OPERATIONS:
            status, seconds = session.request(path)
            with lock:
                results[name].append((status, seconds))


def percentile(values, percent):
    ordered = sorted(values)
    index = max(int(round(percent / 100 * len(ordered))) - 1, 0)
    return ordered[index]


def build_report(results, args, total_seconds):
    all_times = [s for rows in results.values() for _, s in rows]
    errors = sum(1 for rows in results.values() for status, _ in rows if status != 200)
    within = sum(1 for s in all_times if s <= LIMIT_SECONDS)
    percent = 100 * within / len(all_times)
    passed = percent >= TARGET_PERCENT and errors == 0

    lines = [
        f'# Medición de rendimiento (RNF03) — {datetime.now():%d/%m/%Y %H:%M}',
        '',
        f'- **Escenario:** {args.usuarios} usuarios a la vez, {args.rondas} rondas cada uno, '
        f'{len(OPERATIONS)} consultas por ronda ({len(all_times)} solicitudes en {total_seconds:.1f} s).',
        f'- **Entorno:** {platform.system()} {platform.release()}, {os.cpu_count()} núcleos; Docker Compose local; '
        f'peticiones a {args.url} (pasan por el proxy de Vite, como desde el navegador).',
        f'- **Resultado:** {percent:.1f} % de las solicitudes respondió en ≤ {LIMIT_SECONDS:.0f} s '
        f'(meta: {TARGET_PERCENT:.0f} %). Errores: {errors}. **{"Cumple" if passed else "No cumple"}.**',
        '',
        '| Consulta | Solicitudes | Mediana | Percentil 95 | Máximo |',
        '|---|---|---|---|---|',
    ]
    for name, _ in OPERATIONS:
        times = [s for _, s in results[name]]
        lines.append(
            f'| {name} | {len(times)} | {statistics.median(times) * 1000:.0f} ms | '
            f'{percentile(times, 95) * 1000:.0f} ms | {max(times) * 1000:.0f} ms |'
        )
    lines.append(
        f'| **Todas** | {len(all_times)} | {statistics.median(all_times) * 1000:.0f} ms | '
        f'{percentile(all_times, 95) * 1000:.0f} ms | {max(all_times) * 1000:.0f} ms |'
    )
    return '\n'.join(lines), passed


def main():
    parser = argparse.ArgumentParser(description='Mide los tiempos de respuesta de NexoLab (RNF03).')
    parser.add_argument('--usuarios', type=int, default=10)
    parser.add_argument('--rondas', type=int, default=20)
    parser.add_argument('--url', default='http://localhost:5173')
    parser.add_argument('--salida', help='Guarda el informe en este archivo Markdown')
    args = parser.parse_args()

    email = os.environ.get('NEXOLAB_EMAIL', 'carlos.mendoza@gmail.com')
    password = os.environ.get('NEXOLAB_PASSWORD')
    if not password:
        raise SystemExit('Define la contraseña en la variable NEXOLAB_PASSWORD (la de DEMO_PASSWORD).')

    results, lock = defaultdict(list), threading.Lock()
    start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=args.usuarios) as pool:
        futures = [pool.submit(run_user, args.url, email, password, args.rondas, results, lock)
                   for _ in range(args.usuarios)]
        for future in futures:
            future.result()
    report, passed = build_report(results, args, time.perf_counter() - start)

    print(report)
    if args.salida:
        with open(args.salida, 'w', encoding='utf-8') as file:
            file.write(report + '\n')
        print(f'\nInforme guardado en {args.salida}')
    sys.exit(0 if passed else 1)


if __name__ == '__main__':
    main()
