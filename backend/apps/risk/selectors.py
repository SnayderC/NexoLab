"""Consultas del riesgo vigente que usan el dashboard y las pantallas de equipos."""

from .models import DeviceRiskResult, KmeansRun


def _float(value):
    return None if value is None else float(value)


def current_results():
    """Resultado vigente de cada equipo (is_current), con lo que muestran las tarjetas."""
    return DeviceRiskResult.objects.filter(is_current=True).select_related(
        'device__laboratory', 'device__device_type', 'risk_level', 'kmeans_centroid'
    )


def latest_run():
    """Última ejecución completada: la que produjo los resultados vigentes."""
    return (
        KmeansRun.objects.filter(run_status=KmeansRun.RunStatus.COMPLETED).order_by('-finished_at', '-id').first()
    )


def risk_item(result):
    """Tarjeta de riesgo de un equipo (Figma 2.0 y 4.0)."""
    device = result.device
    return {
        'device_code': device.code,
        'laboratory_code': device.laboratory.code,
        'device_type_name': device.device_type.name,
        'risk_level': result.risk_level.code,
        'classification_method': result.classification_method,
        'incident_count': result.incident_count,
        'days_since_last_failure': result.days_since_last_failure,
        'avg_failure_interval_days': _float(result.avg_failure_interval_days),
    }


def centroid_profile(centroid):
    """Perfil promedio de un grupo (centroide), en incidencias y días."""
    return {
        'avg_incident_count': _float(centroid.avg_incident_count),
        'avg_days_since_last_failure': _float(centroid.avg_days_since_last_failure),
        'avg_failure_interval_days': _float(centroid.avg_failure_interval_days),
    }
