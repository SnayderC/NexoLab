from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.incidents.models import Incident
from apps.risk.models import DeviceRiskResult
from apps.risk.selectors import centroid_profile, current_results, risk_item
from apps.risk.serializers import RiskLevelSerializer
from apps.users.permissions import IsAdmin

from .models import Device, DeviceStatus, DeviceType, Laboratory
from .selectors import device_counts_by_laboratory, laboratories_with_counts, open_incident_count
from .serializers import (
    DeviceCreateSerializer,
    DeviceTypeSerializer,
    DeviceUpdateSerializer,
    LaboratoryListSerializer,
    LaboratoryWriteSerializer,
)
from .services import create_device, retire_device

# RN-10
HAS_OPEN_INCIDENTS = 'No se puede desactivar: el laboratorio tiene incidencias abiertas'


def laboratory_response(laboratory_id, response_status=status.HTTP_200_OK):
    """Devuelve el laboratorio con los mismos campos que la lista."""
    laboratory = laboratories_with_counts().get(pk=laboratory_id)
    data = LaboratoryListSerializer(laboratory, context={'device_counts': device_counts_by_laboratory()}).data
    return Response(data, status=response_status)


def open_incidents_conflict(count):
    return Response(
        {'detail': HAS_OPEN_INCIDENTS, 'code': 'has_open_incidents', 'open_incident_count': count},
        status=status.HTTP_409_CONFLICT,
    )


class LaboratoryListView(APIView):
    """GET laboratories (con sesión) · POST laboratories (administrador)."""

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get(self, request):
        context = {'device_counts': device_counts_by_laboratory()}
        return Response(LaboratoryListSerializer(laboratories_with_counts(), many=True, context=context).data)

    def post(self, request):
        serializer = LaboratoryWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        laboratory = serializer.save()
        return laboratory_response(laboratory.pk, status.HTTP_201_CREATED)


class LaboratoryDetailView(APIView):
    """PATCH laboratories/{id} (administrador)."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        laboratory = get_object_or_404(Laboratory, pk=pk)
        serializer = LaboratoryWriteSerializer(laboratory, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # RN-10: tampoco se desactiva desde el formulario si tiene incidencias abiertas.
        if laboratory.is_active and serializer.validated_data.get('is_active') is False:
            count = open_incident_count(pk)
            if count:
                return open_incidents_conflict(count)

        serializer.save()
        return laboratory_response(pk)


class LaboratoryActivationView(APIView):
    """POST laboratories/{id}/activate · POST laboratories/{id}/deactivate (administrador)."""

    permission_classes = [IsAdmin]
    is_active = True

    def post(self, request, pk):
        laboratory = get_object_or_404(Laboratory, pk=pk)
        if not self.is_active:
            count = open_incident_count(pk)
            if count:
                return open_incidents_conflict(count)

        laboratory.is_active = self.is_active
        laboratory.save(update_fields=['is_active', 'updated_at'])
        return laboratory_response(pk)


# ---------- Equipos (Figma 04 y 5.4 a 5.8) ----------

DEVICE_PAGE_SIZE = 10
HISTORY_PAGE_SIZE = 10
RISK_ORDER = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}


def _int_param(request, name):
    value = request.query_params.get(name)
    return int(value) if value and value.isdigit() else None


def _page(request):
    return max(_int_param(request, 'page') or 1, 1)


def _active_device(code):
    return get_object_or_404(
        Device.objects.select_related('laboratory', 'device_type', 'device_status'), code=code, is_active=True
    )


def device_list_item(device, result, incident_count):
    return {
        'id': device.id,
        'code': device.code,
        'laboratory_id': device.laboratory_id,
        'laboratory_code': device.laboratory.code,
        'device_type_id': device.device_type_id,
        'type_name': device.device_type.name,
        'physical_location': device.physical_location,
        'specifications': device.specifications,
        'status': device.device_status.code,
        # Vacío para equipos retirados ("No aplica").
        'risk_level': result.risk_level.code if result else None,
        # Con riesgo vigente, las incidencias que contó el modelo; si no, las registradas.
        'incident_count': result.incident_count if result else incident_count,
    }


class DeviceTypeListView(APIView):
    """GET device-types: catálogo de tipos (con sesión). Los formularios usan solo los seleccionados (RN-07)."""

    def get(self, request):
        return Response(DeviceTypeSerializer(DeviceType.objects.order_by('id'), many=True).data)


class DeviceListView(APIView):
    """GET devices (con sesión, filtros y páginas de 10) · POST devices (administrador)."""

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get(self, request):
        search = request.query_params.get('search', '').strip().upper()
        laboratory_id = _int_param(request, 'laboratory_id')
        device_type_id = _int_param(request, 'device_type_id')
        status_filter = request.query_params.get('status', 'ALL')
        risk_level = request.query_params.get('risk_level')

        devices = Device.objects.filter(is_active=True).select_related('laboratory', 'device_type', 'device_status')
        if search:
            devices = devices.filter(code__icontains=search)
        if laboratory_id:
            devices = devices.filter(laboratory_id=laboratory_id)
        if device_type_id:
            devices = devices.filter(device_type_id=device_type_id)
        if status_filter in (DeviceStatus.ACTIVE, DeviceStatus.RETIRED):
            devices = devices.filter(device_status__code=status_filter)

        results = {result.device_id: result for result in current_results()}
        incident_counts = dict(
            Incident.objects.filter(is_active=True).values_list('device_id').annotate(total=Count('id'))
        )
        rows = [(device, results.get(device.id)) for device in devices]
        if risk_level:
            rows = [(device, result) for device, result in rows if result and result.risk_level.code == risk_level]

        # Riesgo de mayor a menor; luego más incidencias y la falla más reciente primero.
        # Los que no tienen riesgo (retirados) van al final, del retiro más reciente al más antiguo (Figma 5.5).
        def sort_key(row):
            device, result = row
            if result is None:
                return (3, 0, -(device.retired_at.timestamp() if device.retired_at else 0))
            days = result.days_since_last_failure
            return (RISK_ORDER[result.risk_level.code], -result.incident_count, days if days is not None else 10**9)

        rows.sort(key=sort_key)
        start = (_page(request) - 1) * DEVICE_PAGE_SIZE
        items = [
            device_list_item(device, result, incident_counts.get(device.id, 0))
            for device, result in rows[start:start + DEVICE_PAGE_SIZE]
        ]
        return Response({'items': items, 'total': len(rows)})

    def post(self, request):
        serializer = DeviceCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = create_device(serializer.validated_data)
        return Response({'id': device.id, 'code': device.code}, status=status.HTTP_201_CREATED)


class DeviceDetailView(APIView):
    """PATCH devices/{id} (administrador): ubicación, especificaciones y retiro (RN-12)."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        device = get_object_or_404(Device.objects.select_related('device_status'), pk=pk, is_active=True)
        serializer = DeviceUpdateSerializer(device, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        for field in ('physical_location', 'specifications'):
            if field in data:
                setattr(device, field, data[field])
        device.save(update_fields=['physical_location', 'specifications', 'updated_at'])
        if data.get('status') == DeviceStatus.RETIRED and device.device_status.code != DeviceStatus.RETIRED:
            retire_device(device)
        return Response({'id': device.id, 'code': device.code})


class DeviceHistoryView(APIView):
    """GET devices/{code}: datos del equipo, riesgo vigente y evolución mensual (Figma 4.0 a 4.2)."""

    def get(self, request, code):
        device = _active_device(code)
        result = current_results().filter(device=device).first()

        retirement = None
        if device.retired_at:
            incident = (
                Incident.objects.filter(device=device, resolution_action__is_retirement_action=True, is_active=True)
                .select_related('resolution_action')
                .order_by('-closed_at')
                .first()
            )
            retirement = {
                'retired_at': device.retired_at,
                'incident_number': incident.incident_number if incident else None,
                'action_name': incident.resolution_action.name if incident else None,
            }

        current_risk = None
        if result:
            centroid = result.kmeans_centroid
            current_risk = {
                **risk_item(result),
                'risk_level_info': RiskLevelSerializer(result.risk_level).data,
                'calculated_at': result.calculated_at,
                # Perfil promedio del grupo; vacío si el equipo no tiene historial suficiente (RN-23).
                'group_average': centroid_profile(centroid) if centroid else None,
            }

        # Un punto por mes con el nivel de su último cálculo, del más antiguo al más reciente.
        by_month = {}
        if not device.retired_at:
            history = (
                DeviceRiskResult.objects.filter(device=device, kmeans_run__run_status='COMPLETED')
                .select_related('risk_level')
                .order_by('calculated_at', 'id')
            )
            for item in history:
                month = timezone.localtime(item.calculated_at).strftime('%Y-%m')
                by_month[month] = {
                    'month': month,
                    'risk_level': item.risk_level.code,
                    'classification_method': item.classification_method,
                }

        return Response({
            'code': device.code,
            'type_name': device.device_type.name,
            'laboratory_code': device.laboratory.code,
            'physical_location': device.physical_location,
            'specifications': device.specifications,
            'status': device.device_status.code,
            'status_name': device.device_status.name,
            'retirement': retirement,
            'current_risk': current_risk,
            'risk_history': list(by_month.values()),
        })


class DeviceIncidentsView(APIView):
    """GET devices/{code}/incidents: incidencias del equipo, de la más reciente a la más antigua."""

    def get(self, request, code):
        device = _active_device(code)
        incidents = (
            Incident.objects.filter(device=device, is_active=True)
            .select_related('component', 'incident_status', 'resolution_action', 'closed_by')
            .order_by('-opened_at')
        )
        start = (_page(request) - 1) * HISTORY_PAGE_SIZE
        items = [
            {
                'id': incident.id,
                'incident_number': incident.incident_number,
                'opened_at': incident.opened_at,
                'component_name': incident.component.name,
                'priority': incident.priority,
                'status': incident.incident_status.code,
                'diagnosis': incident.diagnosis,
                'resolution_action_name': incident.resolution_action.name if incident.resolution_action else None,
                'resolution_time_minutes': incident.resolution_time_minutes,
                'technician_name': str(incident.closed_by) if incident.closed_by else None,
            }
            for incident in incidents[start:start + HISTORY_PAGE_SIZE]
        ]
        # "now" sirve de referencia para los tiempos relativos ("hace 2 h").
        return Response({'items': items, 'total': incidents.count(), 'now': timezone.now()})
