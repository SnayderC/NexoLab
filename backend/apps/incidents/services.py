"""Registrar, cerrar y anular incidencias (RN-13 a RN-22)."""

from django.db import connection, transaction
from django.utils import timezone

from apps.core import audit
from apps.infrastructure.services import retire_device
from apps.risk.models import KmeansRun
from apps.risk.tasks import schedule_recalculation

from .models import Incident, IncidentStatus


# Identificador del candado de PostgreSQL que serializa la numeración (RN-14).
NUMBERING_LOCK_ID = 2026_14


class IncidentClosedError(Exception):
    """RN-21: una incidencia cerrada no se modifica."""


def next_incident_number(year: int) -> str:
    """RN-14: INC-AAAA-NNNN, correlativo por año. Se llama dentro de una transacción con el candado tomado."""
    prefix = f'INC-{year}-'
    last = (
        Incident.objects.filter(incident_number__startswith=prefix)
        .order_by('-incident_number')
        .values_list('incident_number', flat=True)
        .first()
    )
    number = int(last.removeprefix(prefix)) + 1 if last else 1
    return f'{prefix}{number:04d}'


@transaction.atomic
def create_incident(validated_data, reported_by) -> Incident:
    # Dos registros al mismo tiempo no pueden tomar el mismo número: el candado dura hasta el fin de la transacción.
    with connection.cursor() as cursor:
        cursor.execute('SELECT pg_advisory_xact_lock(%s)', [NUMBERING_LOCK_ID])
    return Incident.objects.create(
        incident_number=next_incident_number(timezone.localdate().year),
        incident_status=IncidentStatus.objects.get(code=IncidentStatus.OPEN),
        reported_by=reported_by,  # RN-15: siempre el usuario de la sesión
        **validated_data,
    )


def close_incident(incident: Incident, data, closed_by) -> Incident:
    with transaction.atomic():
        incident = Incident.objects.select_for_update().select_related('incident_status', 'device').get(pk=incident.pk)
        if incident.incident_status.is_final:
            raise IncidentClosedError

        action = data['resolution_action_id']
        incident.incident_status = IncidentStatus.objects.get(code=IncidentStatus.CLOSED)
        incident.resolution_action = action
        incident.diagnosis = data['diagnosis']
        incident.notes = data.get('notes')
        incident.closed_at = data['closed_at']
        incident.closed_by = closed_by  # RN-15
        # RN-18: minutos entre la falla y el cierre, calculados por el backend.
        incident.resolution_time_minutes = int((incident.closed_at - incident.opened_at).total_seconds() // 60)
        incident.save()

        # RN-19: si la acción retira el equipo, se retira en la misma transacción, con la fecha del cierre.
        if action.is_retirement_action:
            retire_device(incident.device, retired_at=incident.closed_at)

        # D-55: el riesgo se recalcula en segundo plano (Celery) después de confirmar el cierre. Un fallo del
        # modelo no deshace el cierre: la ejecución queda FAILED y el riesgo anterior sigue vigente.
        schedule_recalculation(KmeansRun.TriggerType.INCIDENT_CLOSED, triggered_by=closed_by, incident=incident)
    return incident


def void_incident(incident: Incident, voided_by) -> None:
    """RN-22: anular una incidencia registrada por error. Deja de contar en el riesgo y los indicadores,
    así que el riesgo se recalcula (disparador MANUAL: lo pidió el administrador, D-39)."""
    with transaction.atomic():
        incident.is_active = False
        incident.save(update_fields=['is_active', 'updated_at'])
        audit.record(voided_by, audit.Action.VOID, audit.EntityType.INCIDENT, incident,
                     label=f'{incident.incident_number} ({incident.device.code})')
        schedule_recalculation(KmeansRun.TriggerType.MANUAL, triggered_by=voided_by)
