"""
Recalcula el riesgo de los equipos con K-Means (sección 10).

Uso:  python manage.py recalculate_risk            (disparador MANUAL, lanzado por el sistema)
      python manage.py recalculate_risk --initial  (carga inicial con el dataset de Kaggle, INITIAL_LOAD)
"""

from django.core.management.base import BaseCommand, CommandError

from apps.risk.models import KmeansRun
from apps.risk.services import RiskCalculationError, calculate_risk
from apps.risk.summary import level_counts


class Command(BaseCommand):
    help = 'Recalcula el riesgo de los equipos con K-Means.'

    def add_arguments(self, parser):
        parser.add_argument('--initial', action='store_true', help='Entrena el modelo inicial con el dataset de Kaggle.')

    def handle(self, *args, **options):
        trigger = KmeansRun.TriggerType.INITIAL_LOAD if options['initial'] else KmeansRun.TriggerType.MANUAL
        try:
            run = calculate_risk(trigger)
        except RiskCalculationError as error:
            raise CommandError(str(error)) from error
        self.stdout.write(self.style.SUCCESS(describe_run(run)))


def describe_run(run):
    counts = level_counts(run)
    source = run.parameters['source']['type']
    silhouette = f'{run.silhouette_score}' if run.silhouette_score is not None else 'no aplica'
    return (
        f'Ejecución {run.id} ({run.trigger_type}, modelo {source}): {run.device_count} equipos, '
        f"{run.parameters['kmeans_device_count']} con K-Means. Alto {counts['HIGH']}, medio {counts['MEDIUM']}, "
        f"bajo {counts['LOW']}. Silueta {silhouette}. {run.duration_ms} ms."
    )
