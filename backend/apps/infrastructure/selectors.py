"""Consultas de laboratorios y equipos que usan varias vistas."""

from collections import defaultdict

from django.db.models import Count, Q

from apps.incidents.models import IncidentStatus

from .models import Device, DeviceStatus, Laboratory

# Equipo que cuenta como activo: registro vigente y estado ACTIVE (no retirado).
ACTIVE_DEVICE = Q(is_active=True, device_status__code=DeviceStatus.ACTIVE)


def laboratories_with_counts():
    """Laboratorios con su responsable, equipos activos e incidencias abiertas no anuladas."""
    return (
        Laboratory.objects.select_related('responsible_technician')
        .annotate(
            active_device_count=Count(
                'devices',
                filter=Q(devices__is_active=True, devices__device_status__code=DeviceStatus.ACTIVE),
                distinct=True,
            ),
            open_incident_count=Count(
                'devices__incidents',
                filter=Q(
                    devices__incidents__is_active=True,
                    devices__incidents__incident_status__code=IncidentStatus.OPEN,
                ),
                distinct=True,
            ),
        )
        .order_by('code')
    )


def open_incident_count(laboratory_id):
    return laboratories_with_counts().get(pk=laboratory_id).open_incident_count


def device_counts_by_laboratory():
    """Composición de equipos activos por tipo, en el orden del catálogo: {laboratory_id: [...]}."""
    rows = (
        Device.objects.filter(ACTIVE_DEVICE)
        .values('laboratory_id', 'device_type_id', 'device_type__code', 'device_type__name')
        .annotate(count=Count('id'))
        .order_by('laboratory_id', 'device_type_id')
    )
    counts = defaultdict(list)
    for row in rows:
        counts[row['laboratory_id']].append({
            'device_type_id': row['device_type_id'],
            'code': row['device_type__code'],
            'name': row['device_type__name'],
            'count': row['count'],
        })
    return counts
