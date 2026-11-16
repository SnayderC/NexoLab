from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import CanOperateIncidents, IsAdmin

from .models import Incident, IncidentStatus
from .serializers import IncidentCloseSerializer, IncidentCreateSerializer, eligible_devices
from .services import IncidentClosedError, close_incident, create_incident, void_incident

PAGE_SIZE = 10
# RN-21
ALREADY_CLOSED = 'La incidencia ya está cerrada y no se puede modificar'


def _full_name(user):
    return f'{user.first_name} {user.last_name}' if user else None


def incident_queryset():
    """Incidencias válidas (las anuladas no se muestran, RN-22) con lo que muestran la lista y el detalle."""
    return Incident.objects.filter(is_active=True).select_related(
        'device__laboratory', 'component', 'incident_status', 'resolution_action', 'reported_by', 'closed_by'
    )


def list_item(incident):
    return {
        'id': incident.id,
        'incident_number': incident.incident_number,
        'device_code': incident.device.code,
        'laboratory_code': incident.device.laboratory.code,
        'component_name': incident.component.name,
        'priority': incident.priority,
        'status': incident.incident_status.code,
        'opened_at': incident.opened_at,
        'resolution_time_minutes': incident.resolution_time_minutes,
        'reported_by_name': _full_name(incident.reported_by),
        'closed_by_name': _full_name(incident.closed_by),
        'resolution_action_name': incident.resolution_action.name if incident.resolution_action else None,
    }


def detail(incident):
    return {
        **list_item(incident),
        'device_id': incident.device_id,
        'description': incident.description,
        'diagnosis': incident.diagnosis,
        'notes': incident.notes,
        'closed_at': incident.closed_at,
    }


def _get(number):
    return get_object_or_404(incident_queryset(), incident_number=number)


class IncidentListView(APIView):
    """GET incidents (con sesión, filtros y páginas de 10) · POST incidents (técnico o administrador en
    modo técnico, RN-13 a RN-16 y RN-24)."""

    def get_permissions(self):
        return [CanOperateIncidents()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get(self, request):
        params = request.query_params
        valid = incident_queryset()
        incidents = valid

        status_filter = params.get('status', 'ALL')
        if status_filter in (IncidentStatus.OPEN, IncidentStatus.CLOSED):
            incidents = incidents.filter(incident_status__code=status_filter)
        search = params.get('search', '').strip()
        if search:
            incidents = incidents.filter(Q(incident_number__icontains=search) | Q(device__code__icontains=search))
        if params.get('laboratory_id', '').isdigit():
            incidents = incidents.filter(device__laboratory_id=params['laboratory_id'])
        if params.get('priority') in Incident.Priority.values:
            incidents = incidents.filter(priority=params['priority'])
        # Fechas de la falla (aaaa-mm-dd), en la hora de Ecuador (TIME_ZONE).
        if date_from := parse_date(params.get('from') or ''):
            incidents = incidents.filter(opened_at__date__gte=date_from)
        if date_to := parse_date(params.get('to') or ''):
            incidents = incidents.filter(opened_at__date__lte=date_to)

        incidents = incidents.order_by('-opened_at', '-id')
        page = max(int(params['page']) if params.get('page', '').isdigit() else 1, 1)
        start = (page - 1) * PAGE_SIZE
        return Response({
            'items': [list_item(incident) for incident in incidents[start:start + PAGE_SIZE]],
            'total': incidents.count(),
            # Cantidad por pestaña, sin los demás filtros.
            'counts': {
                'OPEN': valid.filter(incident_status__code=IncidentStatus.OPEN).count(),
                'CLOSED': valid.filter(incident_status__code=IncidentStatus.CLOSED).count(),
                'ALL': valid.count(),
            },
            # Referencia para los tiempos relativos ("hace 2 h 15 min").
            'now': timezone.now(),
        })

    def post(self, request):
        serializer = IncidentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        incident = create_incident(serializer.validated_data, reported_by=request.user)
        return Response(detail(_get(incident.incident_number)), status=status.HTTP_201_CREATED)


class IncidentDetailView(APIView):
    """GET incidents/{número}: detalle de una incidencia."""

    def get(self, request, number):
        return Response(detail(_get(number)))


class IncidentCloseView(APIView):
    """POST incidents/{número}/close (técnico o administrador en modo técnico, RN-24): RN-17 a RN-21 y
    recálculo INCIDENT_CLOSED."""

    permission_classes = [CanOperateIncidents]

    def post(self, request, number):
        incident = _get(number)
        if incident.incident_status.is_final:
            return Response({'detail': ALREADY_CLOSED, 'code': 'incident_closed'}, status=status.HTTP_409_CONFLICT)
        serializer = IncidentCloseSerializer(data=request.data, context={'incident': incident})
        serializer.is_valid(raise_exception=True)
        try:
            close_incident(incident, serializer.validated_data, closed_by=request.user)
        except IncidentClosedError:
            # Otro usuario la cerró mientras tanto.
            return Response({'detail': ALREADY_CLOSED, 'code': 'incident_closed'}, status=status.HTTP_409_CONFLICT)

        closed = _get(number)
        retired = closed.resolution_action.is_retirement_action
        return Response({**detail(closed), 'retired_device_code': closed.device.code if retired else None})


class IncidentVoidView(APIView):
    """POST incidents/{número}/void (administrador, RN-22). Recalcula el riesgo después de anular."""

    permission_classes = [IsAdmin]

    def post(self, request, number):
        void_incident(_get(number), voided_by=request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


class EligibleDeviceListView(APIView):
    """GET devices/eligible?laboratory_id= o ?code=: equipos que admiten incidencias (RN-13),
    para el formulario de registro."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        devices = eligible_devices().select_related('device_type').order_by('code')
        laboratory_id = request.query_params.get('laboratory_id', '')
        code = request.query_params.get('code', '').strip()
        if laboratory_id.isdigit():
            devices = devices.filter(laboratory_id=laboratory_id)
        elif code:
            devices = devices.filter(code__iexact=code)
        else:
            devices = devices.none()
        return Response([
            {
                'id': device.id,
                'code': device.code,
                'laboratory_id': device.laboratory_id,
                'label': ' · '.join(filter(None, [device.code, device.device_type.name, device.physical_location])),
            }
            for device in devices
        ])
