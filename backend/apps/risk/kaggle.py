"""
Dataset de Kaggle para la carga inicial del modelo (sección 10, disparador INITIAL_LOAD).

Archivo: backend/data/ITSM_data.csv (incidencias de TI de una empresa, 2012-2014). No se inserta en las
tablas de operación: solo se calculan las 3 variables por equipo (CI_Name) para entrenar K-Means.
"""

import csv
import hashlib
from collections import defaultdict
from datetime import datetime
from pathlib import Path

from django.conf import settings

from .kmeans import compute_features

DATASET_PATH = Path(settings.BASE_DIR) / 'data' / 'ITSM_data.csv'

# Equipos parecidos a los de un laboratorio de cómputo (PC, monitor, teclado, UPS).
# Se descartan aplicaciones, servidores, redes y almacenamiento.
EQUIPMENT_SUBCATEGORIES = ['Desktop', 'Laptop', 'Thin Client', 'Monitor', 'Keyboard', 'UPS']
# Solo fallas: se descartan solicitudes de información, quejas y pedidos de cambio.
INCIDENT_CATEGORY = 'incident'


def _parse_date(value: str) -> datetime:
    # El archivo mezcla "5/2/2012 13:32" y "29-03-2012 12:36"; en ambos va primero el día.
    return datetime.strptime(value.strip().replace('-', '/'), '%d/%m/%Y %H:%M')


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open('rb') as file:
        for chunk in iter(lambda: file.read(1 << 20), b''):
            digest.update(chunk)
    return digest.hexdigest()


def load_training_rows(path: Path = DATASET_PATH) -> tuple[list[list[float]], dict]:
    """Filas de entrenamiento (equipos con al menos 2 incidencias) y el origen de los datos,
    que se guarda en hst_kmeans_runs.parameters."""
    if not path.exists():
        raise FileNotFoundError(f'No se encontró el dataset de Kaggle en {path}')

    opened_by_device = defaultdict(list)
    record_count = 0
    with path.open(encoding='utf-8', newline='') as file:
        for row in csv.DictReader(file):
            record_count += 1
            if row['CI_Subcat'] in EQUIPMENT_SUBCATEGORIES and row['Category'] == INCIDENT_CATEGORY:
                opened_by_device[row['CI_Name']].append(_parse_date(row['Open_Time']))

    # "Días desde la última falla" se mide desde la última fecha del dataset, no desde hoy.
    reference = max(date for dates in opened_by_device.values() for date in dates)
    features = [compute_features(dates, reference) for dates in opened_by_device.values()]
    rows = [f.as_row() for f in features if f.has_history]

    source = {
        'type': 'KAGGLE',
        'file': path.name,
        'sha256': _sha256(path),
        'record_count': record_count,
        'filter': {'CI_Subcat': EQUIPMENT_SUBCATEGORIES, 'Category': INCIDENT_CATEGORY},
        'incident_count': sum(f.incident_count for f in features),
        'device_count': len(features),
        'training_device_count': len(rows),
        'reference_date': reference.isoformat(),
    }
    return rows, source
