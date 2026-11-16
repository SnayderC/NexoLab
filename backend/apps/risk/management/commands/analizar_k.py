"""
Análisis del número de grupos k (D-57): método del codo y coeficiente de silueta para k = 2 a 8.

Uso:  python manage.py analizar_k [--salida ../docs/evidencias]

Usa el mismo preprocesamiento que el modelo (StandardScaler) y los mismos parámetros de KMeans (semilla 42,
10 inicializaciones), con dos conjuntos de datos:
- Kaggle: los 142 equipos con 2 o más incidencias del dataset ITSM (carga inicial).
- Datos propios: los equipos del laboratorio con 2 o más incidencias, al día de hoy.

Genera analisis_k.md (tablas y lectura de los resultados) y dos gráficos SVG para la tesis.
No cambia datos ni el modelo: solo lee.
"""

from pathlib import Path

import numpy as np
from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone
from sklearn.cluster import KMeans
from sklearn.metrics import davies_bouldin_score, silhouette_score
from sklearn.preprocessing import StandardScaler

from apps.risk import kaggle, kmeans
from apps.risk.services import device_features, eligible_devices

K_VALUES = range(2, 9)


def evaluate(rows):
    """Inercia, silueta y Davies-Bouldin para cada k."""
    scaled = StandardScaler().fit_transform(np.asarray(rows, dtype=float))
    results = []
    for k in K_VALUES:
        model = KMeans(n_clusters=k, random_state=kmeans.RANDOM_SEED, n_init=kmeans.INITIALIZATIONS,
                       max_iter=kmeans.MAX_ITERATIONS).fit(scaled)
        results.append({
            'k': k,
            'inertia': float(model.inertia_),
            'silhouette': float(silhouette_score(scaled, model.labels_)),
            'davies_bouldin': float(davies_bouldin_score(scaled, model.labels_)),
            'smallest_group': int(np.bincount(model.labels_).min()),
        })
    return results


def elbow(results):
    """k del codo: el punto más alejado de la recta que une la primera y la última inercia (normalizadas)."""
    ks = np.array([r['k'] for r in results], dtype=float)
    inertias = np.array([r['inertia'] for r in results])
    x = (ks - ks.min()) / (ks.max() - ks.min())
    y = (inertias - inertias.min()) / (inertias.max() - inertias.min())
    distances = np.abs((y[-1] - y[0]) * x - (x[-1] - x[0]) * y + x[-1] * y[0] - y[-1] * x[0])
    return int(ks[int(np.argmax(distances))])


def svg_chart(title, series, y_label, path):
    """Gráfico de líneas simple en SVG (sin librerías). series: [(nombre, color, [(k, valor), ...])]."""
    width, height, left, right, top, bottom = 640, 360, 70, 20, 40, 50
    values = [v for _, _, points in series for _, v in points]
    low, high = min(0.0, min(values)), max(values) * 1.1
    def sx(k):
        return left + (k - K_VALUES.start) / (K_VALUES.stop - 1 - K_VALUES.start) * (width - left - right)
    def sy(v):
        return top + (1 - (v - low) / (high - low)) * (height - top - bottom)
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" font-family="sans-serif" font-size="12">',
        f'<rect width="{width}" height="{height}" fill="white"/>',
        f'<text x="{width / 2}" y="22" text-anchor="middle" font-size="15" font-weight="bold">{title}</text>',
        f'<line x1="{left}" y1="{height - bottom}" x2="{width - right}" y2="{height - bottom}" stroke="#555"/>',
        f'<line x1="{left}" y1="{top}" x2="{left}" y2="{height - bottom}" stroke="#555"/>',
        f'<text x="{width / 2}" y="{height - 12}" text-anchor="middle">Número de grupos (k)</text>',
        f'<text x="18" y="{(top + height - bottom) / 2}" text-anchor="middle" '
        f'transform="rotate(-90 18 {(top + height - bottom) / 2})">{y_label}</text>',
    ]
    for k in K_VALUES:
        parts.append(f'<text x="{sx(k)}" y="{height - bottom + 18}" text-anchor="middle">{k}</text>')
    for i in range(5):
        v = low + (high - low) * i / 4
        parts.append(f'<line x1="{left}" y1="{sy(v)}" x2="{width - right}" y2="{sy(v)}" stroke="#eee"/>')
        parts.append(f'<text x="{left - 8}" y="{sy(v) + 4}" text-anchor="end">{v:.2f}</text>')
    # Marca de k = 3, el valor elegido.
    parts.append(f'<line x1="{sx(3)}" y1="{top}" x2="{sx(3)}" y2="{height - bottom}" stroke="#7c3aed" '
                 f'stroke-dasharray="4 4"/><text x="{sx(3) + 6}" y="{top + 12}" fill="#7c3aed">k = 3</text>')
    for index, (name, color, points) in enumerate(series):
        path_data = ' '.join(f'{"M" if i == 0 else "L"}{sx(k):.1f},{sy(v):.1f}' for i, (k, v) in enumerate(points))
        parts.append(f'<path d="{path_data}" fill="none" stroke="{color}" stroke-width="2"/>')
        parts.extend(f'<circle cx="{sx(k):.1f}" cy="{sy(v):.1f}" r="3.5" fill="{color}"/>' for k, v in points)
        parts.append(f'<rect x="{width - right - 150}" y="{top + 8 + index * 18}" width="12" height="12" fill="{color}"/>'
                     f'<text x="{width - right - 132}" y="{top + 18 + index * 18}">{name}</text>')
    parts.append('</svg>')
    Path(path).write_text('\n'.join(parts), encoding='utf-8')


class Command(BaseCommand):
    help = 'Método del codo y silueta para justificar k = 3 (D-57).'

    def add_arguments(self, parser):
        # Con Docker, la carpeta docs/ no está dentro del contenedor: se usa --salida dentro de backend/ y se mueve.
        parser.add_argument('--salida', default=str(Path(settings.BASE_DIR).parent / 'docs' / 'evidencias'))

    def handle(self, *args, **options):
        output = Path(options['salida'])
        output.mkdir(parents=True, exist_ok=True)

        kaggle_rows, _ = kaggle.load_training_rows()
        now = timezone.now()
        devices = list(eligible_devices().values_list('id', flat=True))
        features = device_features(devices, now)
        own_rows = [f.as_row() for f in features.values() if f.has_history]

        datasets = [('Kaggle (carga inicial)', 'kaggle', kaggle_rows, '#2563eb'),
                    ('Datos propios', 'propios', own_rows, '#059669')]
        evaluated = [(name, key, rows, color, evaluate(rows)) for name, key, rows, color in datasets]

        lines = [
            f'# Análisis del número de grupos k (D-57) — {timezone.localtime(now):%d/%m/%Y %H:%M}',
            '',
            'Mismo preprocesamiento y parámetros que el modelo: `StandardScaler` y `KMeans(random_state=42, n_init=10)`.',
            'Generado con `python manage.py analizar_k`.',
            '',
        ]
        for name, key, rows, _, results in evaluated:
            best_silhouette = max(results, key=lambda r: r['silhouette'])
            k3 = next(r for r in results if r['k'] == 3)
            lines += [
                f'## {name}: {len(rows)} equipos con 2 o más incidencias',
                '',
                '| k | Inercia | Silueta | Davies-Bouldin | Grupo más pequeño |',
                '|---|---|---|---|---|',
            ]
            lines += [f'| {r["k"]}{" (elegido)" if r["k"] == 3 else ""} | {r["inertia"]:.1f} | {r["silhouette"]:.3f} | '
                      f'{r["davies_bouldin"]:.3f} | {r["smallest_group"]} equipos |' for r in results]
            lines += [
                '',
                f'- **Codo de la inercia:** k = {elbow(results)}.',
                f'- **Mejor silueta:** k = {best_silhouette["k"]} ({best_silhouette["silhouette"]:.3f}); '
                f'con k = 3 es {k3["silhouette"]:.3f}.',
                '',
            ]
            svg_chart(f'Método del codo — {name}', [('Inercia', '#2563eb' if key == 'kaggle' else '#059669',
                                                     [(r['k'], r['inertia']) for r in results])],
                      'Inercia', output / f'codo_{key}.svg')
        svg_chart('Coeficiente de silueta por k',
                  [(name, color, [(r['k'], r['silhouette']) for r in results]) for name, _, _, color, results in evaluated],
                  'Silueta', output / 'silueta.svg')
        lines += [
            '## Gráficos',
            '',
            '- `codo_kaggle.svg` y `codo_propios.svg`: inercia por k (método del codo).',
            '- `silueta.svg`: silueta por k para los dos conjuntos.',
            '',
        ]
        (output / 'analisis_k.md').write_text('\n'.join(lines), encoding='utf-8')
        self.stdout.write('\n'.join(lines))
        self.stdout.write(self.style.SUCCESS(f'Informe y gráficos guardados en {output}'))
