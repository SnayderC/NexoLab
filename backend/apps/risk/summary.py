"""Resúmenes de una ejecución de K-Means que usan el comando y la API."""

from django.db.models import Count

from .models import KmeansRun, RiskLevel


def level_counts(run: KmeansRun) -> dict[str, int]:
    """Equipos por nivel de riesgo en una ejecución, con los 3 niveles aunque alguno quede en 0."""
    counts = dict(run.results.values_list('risk_level__code').annotate(total=Count('id')))
    return {code: counts.get(code, 0) for code in RiskLevel.objects.order_by('id').values_list('code', flat=True)}
