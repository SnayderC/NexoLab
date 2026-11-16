"""
Cálculo del riesgo de los equipos (sección 10). Lo usan el comando recalculate_risk, seed_demo
y POST risk/recalculate.

Qué modelo se usa en cada ejecución (D-33):
- INITIAL_LOAD: se entrena con el dataset de Kaggle y con él se clasifican los equipos del Bloque H.
- Resto de ejecuciones: si al menos RISK_MIN_OWN_HISTORY_DEVICES equipos (30 por defecto, configurable por
  instalación) tienen historial propio, se entrena con ese historial; si no, se clasifica con el modelo de la
  última carga inicial.
"""

import time
from collections import defaultdict
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import connection, transaction
from django.db.models import Q
from django.utils import timezone

from apps.incidents.models import Incident
from apps.infrastructure.models import Device, DeviceType

from . import kaggle, kmeans
from .models import DeviceRiskResult, KmeansCentroid, KmeansRun, RiskLevel

Trigger = KmeansRun.TriggerType

# Candado de PostgreSQL: dos cálculos nunca se cruzan (por ejemplo, el programado de Celery y el botón
# "Recalcular ahora" al mismo tiempo). El segundo espera a que termine el primero (D-55).
RISK_LOCK_ID = 7_300_001


class RiskCalculationError(Exception):
    """El cálculo no se pudo completar. La ejecución queda como FAILED y los resultados vigentes no cambian."""


def _decimal(value, places):
    return None if value is None else Decimal(str(round(float(value), places)))


def eligible_devices(as_of=None):
    """Paso 1: equipos vigentes, con un estado que entra al cálculo y de un tipo seleccionado (RN-07, RN-12).
    Con as_of (historial de demostración, D-42) cuenta como vigente el que todavía no se retiraba en esa fecha."""
    devices = Device.objects.filter(is_active=True, device_type__is_selected=True)
    if as_of is None:
        devices = devices.filter(device_status__is_included_in_kmeans=True)
    else:
        devices = devices.filter(Q(retired_at__isnull=True) | Q(retired_at__gt=as_of))
    return devices.order_by('id')


def device_features(device_ids, now):
    """Las 3 variables de cada equipo, con sus incidencias válidas (las anuladas no cuentan, RN-22)."""
    opened = defaultdict(list)
    # Solo las fallas ocurridas hasta el momento del cálculo.
    incidents = Incident.objects.filter(device_id__in=device_ids, is_active=True, opened_at__lte=now)
    for device_id, opened_at in incidents.values_list('device_id', 'opened_at'):
        opened[device_id].append(opened_at)
    return {device_id: kmeans.compute_features(opened[device_id], now) for device_id in device_ids}


def _initial_model():
    run = (
        KmeansRun.objects.filter(trigger_type=Trigger.INITIAL_LOAD, run_status=KmeansRun.RunStatus.COMPLETED)
        .order_by('-started_at')
        .first()
    )
    if run is None:
        raise RiskCalculationError(
            'No hay un modelo inicial. Ejecuta primero la carga inicial: python manage.py recalculate_risk --initial'
        )
    return run, kmeans.Model.from_dict(run.parameters['model'])


def _build_model(trigger_type, own_rows):
    """Elige el modelo de esta ejecución. Devuelve (modelo, agrupamiento de los equipos propios,
    métricas que se guardan en la ejecución, origen de los datos)."""
    if trigger_type == Trigger.INITIAL_LOAD:
        training_rows, source = kaggle.load_training_rows()
        model, training = kmeans.train(training_rows)
        source['cluster_sizes'] = [int((training.labels == i).sum()) for i in range(kmeans.CLUSTER_COUNT)]
        # Las métricas describen la calidad del modelo entrenado con Kaggle.
        return model, kmeans.classify(model, own_rows), training, {**source, 'metrics_scope': 'TRAINING'}

    # Nunca menos de k equipos: K-Means no puede formar 3 grupos con menos.
    if len(own_rows) >= max(settings.RISK_MIN_OWN_HISTORY_DEVICES, kmeans.CLUSTER_COUNT):
        model, clustering = kmeans.train(own_rows)
        return model, clustering, clustering, {'type': 'OWN_HISTORY', 'metrics_scope': 'TRAINING'}

    base_run, model = _initial_model()
    clustering = kmeans.classify(model, own_rows)
    # Con pocos equipos, la silueta puede no calcularse (queda vacía).
    source = {'type': 'KAGGLE_MODEL', 'model_run_id': base_run.id, 'metrics_scope': 'ASSIGNMENT'}
    return model, clustering, clustering, source


def calculate_risk(trigger_type, triggered_by=None, incident=None, as_of=None) -> KmeansRun:
    """Ejecuta el cálculo completo y guarda la ejecución, sus centroides y un resultado por equipo.
    as_of calcula como si fuera esa fecha pasada; solo lo usa seed_demo para armar la evolución mensual (D-42)."""
    started = time.monotonic()
    now = as_of or timezone.now()
    run = KmeansRun.objects.create(
        trigger_type=trigger_type,
        triggered_by=triggered_by,
        incident=incident,
        run_status=KmeansRun.RunStatus.RUNNING,
        cluster_count=kmeans.CLUSTER_COUNT,
        max_iterations=kmeans.MAX_ITERATIONS,
        random_seed=kmeans.RANDOM_SEED,
        started_at=now,
    )

    try:
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute('SELECT pg_advisory_xact_lock(%s)', [RISK_LOCK_ID])
            devices = list(eligible_devices(as_of).values_list('id', flat=True))
            features = device_features(devices, now)
            # Paso 2 (RN-23): solo los equipos con al menos 2 incidencias entran al algoritmo.
            with_history = [device_id for device_id in devices if features[device_id].has_history]
            own_rows = [features[device_id].as_row() for device_id in with_history]
            model, clustering, metrics, source = _build_model(trigger_type, own_rows)
            _save(run, model, clustering, metrics, source, devices, features, with_history, now, started)
    except Exception as error:
        known = isinstance(error, (RiskCalculationError, ValueError, FileNotFoundError))
        run.run_status = KmeansRun.RunStatus.FAILED
        run.error_message = str(error) if known else f'{type(error).__name__}: {error}'
        run.finished_at = now + timedelta(seconds=time.monotonic() - started)
        run.duration_ms = int((time.monotonic() - started) * 1000)
        run.save()
        raise RiskCalculationError(run.error_message if known else 'Ocurrió un error al calcular el riesgo') from error
    return run


def _save(run, model, clustering, metrics, source, devices, features, with_history, now, started):
    levels = {level.code: level for level in RiskLevel.objects.all()}
    centroids_in_units = model.centroids_in_units()

    centroids = [
        KmeansCentroid.objects.create(
            kmeans_run=run,
            cluster_index=index,
            risk_level=levels[model.levels[index]],
            avg_incident_count=_decimal(centroids_in_units[index][0], 4),
            avg_days_since_last_failure=_decimal(centroids_in_units[index][1], 4),
            avg_failure_interval_days=_decimal(centroids_in_units[index][2], 4),
            device_count=int((clustering.labels == index).sum()),
        )
        for index in range(kmeans.CLUSTER_COUNT)
    ]

    # Paso 5: los resultados anteriores dejan de ser los vigentes.
    DeviceRiskResult.objects.filter(is_current=True).update(is_current=False, updated_at=now)

    assignment = {
        device_id: (centroids[label], distance)
        for device_id, label, distance in zip(with_history, clustering.labels.tolist(), clustering.distances.tolist())
    }
    results = []
    for device_id in devices:
        feature = features[device_id]
        centroid, distance = assignment.get(device_id, (None, None))
        results.append(DeviceRiskResult(
            kmeans_run=run,
            device_id=device_id,
            classification_method=(
                DeviceRiskResult.ClassificationMethod.KMEANS if centroid
                else DeviceRiskResult.ClassificationMethod.INSUFFICIENT_HISTORY
            ),
            kmeans_centroid=centroid,
            # RN-23: sin historial suficiente, riesgo bajo por regla.
            risk_level=centroid.risk_level if centroid else levels['LOW'],
            incident_count=feature.incident_count,
            days_since_last_failure=(
                None if feature.days_since_last_failure is None else int(feature.days_since_last_failure)
            ),
            avg_failure_interval_days=_decimal(feature.avg_failure_interval_days, 2),
            distance_to_centroid=_decimal(distance, 6),
            is_current=True,
            calculated_at=now,
        ))
    DeviceRiskResult.objects.bulk_create(results)

    run.run_status = KmeansRun.RunStatus.COMPLETED
    run.device_count = len(devices)
    run.inertia = _decimal(metrics.inertia, 4)
    run.silhouette_score = _decimal(metrics.silhouette, 5)
    run.davies_bouldin_index = _decimal(metrics.davies_bouldin, 5)
    run.iteration_count = metrics.iteration_count
    run.has_converged = metrics.has_converged
    run.parameters = {
        'features': kmeans.FEATURES,
        'scaler': 'StandardScaler',
        'n_init': kmeans.INITIALIZATIONS,
        'min_incidents': kmeans.MIN_INCIDENTS,
        'min_own_history_devices': settings.RISK_MIN_OWN_HISTORY_DEVICES,
        'selected_device_types': list(
            DeviceType.objects.filter(is_selected=True).order_by('id').values_list('code', flat=True)
        ),
        'kmeans_device_count': len(with_history),
        'source': source,
        'model': model.to_dict(),
    }
    run.finished_at = now + timedelta(seconds=time.monotonic() - started)
    run.duration_ms = int((time.monotonic() - started) * 1000)
    run.save()
