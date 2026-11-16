"""
Tareas de Celery del modelo de riesgo (D-55, RF11, RNF07).

- recalculate_risk_task: ejecuta K-Means. La usan Celery Beat (cada 15 minutos, disparador SCHEDULED) y
  schedule_recalculation.
- schedule_recalculation: la encola después de confirmar el cambio que la dispara (cierre o anulación de una
  incidencia, equipo nuevo). Así el técnico no espera al modelo. Si Redis no responde, calcula en el momento.

Un error del modelo nunca deshace el cambio que lo disparó: la ejecución queda FAILED con su mensaje.
"""

import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.db import transaction

from .services import RiskCalculationError, calculate_risk

logger = logging.getLogger(__name__)


@shared_task(name='apps.risk.tasks.recalculate_risk_task')
def recalculate_risk_task(trigger_type, triggered_by_id=None, incident_id=None):
    from apps.incidents.models import Incident

    user = get_user_model().objects.filter(pk=triggered_by_id).first() if triggered_by_id else None
    incident = Incident.objects.filter(pk=incident_id).first() if incident_id else None
    try:
        return calculate_risk(trigger_type, triggered_by=user, incident=incident).id
    except RiskCalculationError as error:
        logger.warning('No se pudo recalcular el riesgo (%s): %s', trigger_type, error)
        return None


def schedule_recalculation(trigger_type, triggered_by=None, incident=None):
    """Encola el recálculo para cuando se confirme la transacción en curso."""
    kwargs = {
        'trigger_type': trigger_type,
        'triggered_by_id': getattr(triggered_by, 'pk', None),
        'incident_id': getattr(incident, 'pk', None),
    }

    def send():
        try:
            recalculate_risk_task.delay(**kwargs)
        except Exception:  # Redis caído o inaccesible: no se pierde el recálculo, se hace aquí mismo.
            logger.warning('Celery no disponible; el riesgo se recalcula en el momento (%s)', trigger_type)
            recalculate_risk_task(**kwargs)

    transaction.on_commit(send)
