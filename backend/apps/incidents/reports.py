"""
GET reports/summary (D-40): resumen de un periodo para la pantalla Reportes.

Filtros: from y to (aaaa-mm-dd, hora de Ecuador; por defecto los últimos 30 días) y laboratory_id.
Una incidencia cuenta como registrada si su falla (opened_at) cae en el periodo, y como cerrada si su
cierre (closed_at) cae en el periodo. Las anuladas no cuentan (RN-22).
"""

from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.infrastructure.models import Device, Laboratory
from apps.risk.selectors import current_results
from apps.users.models import User

from .models import Component, Incident

DEFAULT_PERIOD_DAYS = 30
TOP_DEVICE_COUNT = 10
PRIORITY_ORDER = [Incident.Priority.HIGH, Incident.Priority.MEDIUM, Incident.Priority.LOW]


def _round(value):
    return None if value is None else round(value)


class ReportSummaryView(APIView):
    """Con sesión: técnicos y administradores consultan los mismos reportes."""

    def get(self, request):
        today = timezone.localdate()
        date_to = parse_date(request.query_params.get('to') or '') or today
        date_from = parse_date(request.query_params.get('from') or '')
        date_from = date_from or date_to - timedelta(days=DEFAULT_PERIOD_DAYS - 1)
        if date_from > date_to:
            return Response(
                {'detail': 'La fecha "desde" no puede ser posterior a la fecha "hasta"'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        laboratory_id = request.query_params.get('laboratory_id')
        laboratory_id = int(laboratory_id) if laboratory_id and laboratory_id.isdigit() else None

        incidents = Incident.objects.filter(is_active=True)
        devices = Device.objects.filter(is_active=True)
        if laboratory_id:
            incidents = incidents.filter(device__laboratory_id=laboratory_id)
            devices = devices.filter(laboratory_id=laboratory_id)
        registered = incidents.filter(opened_at__date__gte=date_from, opened_at__date__lte=date_to)
        closed = incidents.filter(closed_at__date__gte=date_from, closed_at__date__lte=date_to)

        return Response({
            'period': {'from': date_from, 'to': date_to},
            'indicators': {
                'registered_count': registered.count(),
                'closed_count': closed.count(),
                'avg_resolution_minutes': _round(closed.aggregate(value=Avg('resolution_time_minutes'))['value']),
                'retired_device_count': devices.filter(
                    retired_at__date__gte=date_from, retired_at__date__lte=date_to
                ).count(),
            },
            'by_laboratory': self._by_laboratory(registered, laboratory_id),
            'by_component': self._by_component(registered),
            'by_priority': self._by_priority(registered),
            'by_technician': self._by_technician(registered, closed),
            'top_devices': self._top_devices(registered),
        })

    def _by_laboratory(self, registered, laboratory_id):
        counts = dict(registered.values_list('device__laboratory_id').annotate(total=Count('id')))
        # Los laboratorios activos aparecen aunque no tengan incidencias, para comparar.
        laboratories = Laboratory.objects.filter(Q(is_active=True) | Q(id__in=counts)).order_by('code')
        if laboratory_id:
            laboratories = laboratories.filter(id=laboratory_id)
        rows = [{'id': lab.id, 'label': lab.code, 'count': counts.get(lab.id, 0)} for lab in laboratories]
        return sorted(rows, key=lambda row: -row['count'])

    def _by_component(self, registered):
        counts = dict(registered.values_list('component_id').annotate(total=Count('id')))
        components = Component.objects.filter(Q(is_active=True) | Q(id__in=counts)).order_by('id')
        rows = [{'id': c.id, 'label': c.name, 'count': counts.get(c.id, 0)} for c in components]
        return sorted(rows, key=lambda row: -row['count'])

    def _by_priority(self, registered):
        counts = dict(registered.values_list('priority').annotate(total=Count('id')))
        return [{'priority': priority, 'count': counts.get(priority, 0)} for priority in PRIORITY_ORDER]

    def _by_technician(self, registered, closed):
        reported = dict(registered.values_list('reported_by_id').annotate(total=Count('id')))
        closed_stats = {
            row['closed_by_id']: row
            for row in closed.values('closed_by_id').annotate(total=Count('id'), avg=Avg('resolution_time_minutes'))
        }
        # Solo quienes registraron o cerraron algo en el periodo.
        users = User.objects.filter(id__in=set(reported) | set(closed_stats)).order_by('first_name', 'last_name')
        rows = [
            {
                'id': user.id,
                'name': str(user),
                'registered_count': reported.get(user.id, 0),
                'closed_count': closed_stats.get(user.id, {}).get('total', 0),
                'avg_resolution_minutes': _round(closed_stats.get(user.id, {}).get('avg')),
            }
            for user in users
        ]
        return sorted(rows, key=lambda row: -(row['registered_count'] + row['closed_count']))

    def _top_devices(self, registered):
        top = list(
            registered.values('device_id').annotate(total=Count('id')).order_by('-total', 'device__code')[
                :TOP_DEVICE_COUNT
            ]
        )
        devices = Device.objects.select_related('laboratory', 'device_type').in_bulk([row['device_id'] for row in top])
        risks = {result.device_id: result.risk_level.code for result in current_results()}
        return [
            {
                'code': devices[row['device_id']].code,
                'laboratory_code': devices[row['device_id']].laboratory.code,
                'type_name': devices[row['device_id']].device_type.name,
                'incident_count': row['total'],
                # Vacío si el equipo está retirado (sin riesgo vigente).
                'risk_level': risks.get(row['device_id']),
            }
            for row in top
        ]
