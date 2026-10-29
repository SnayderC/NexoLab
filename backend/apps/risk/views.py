from datetime import timedelta

from django.db.models import Avg
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.incidents.models import Incident, IncidentStatus
from apps.infrastructure.models import Device, DeviceStatus
from apps.users.permissions import IsAdmin

from .models import KmeansRun, RiskLevel
from .selectors import centroid_profile, current_results, latest_run, risk_item
from .serializers import RiskLevelSerializer
from .services import RiskCalculationError, calculate_risk
from .summary import level_counts

# Tiempo promedio de atención: incidencias cerradas en los últimos 30 días (Figma 2.0).
AVERAGE_WINDOW_DAYS = 30


class RecalculateView(APIView):
    """POST risk/recalculate: recálculo manual del riesgo (solo administrador)."""

    permission_classes = [IsAdmin]

    def post(self, request):
        try:
            run = calculate_risk(KmeansRun.TriggerType.MANUAL, triggered_by=request.user)
        except RiskCalculationError as error:
            # La ejecución queda como FAILED y el riesgo vigente no cambia.
            return Response({'detail': str(error), 'code': 'risk_failed'}, status=status.HTTP_409_CONFLICT)

        return Response({
            'kmeans_run_id': run.id,
            'run_status': run.run_status,
            'model_source': run.parameters['source']['type'],
            'device_count': run.device_count,
            'kmeans_device_count': run.parameters['kmeans_device_count'],
            'level_counts': level_counts(run),
            'silhouette_score': run.silhouette_score,
            'finished_at': run.finished_at,
        })


class DashboardSummaryView(APIView):
    """GET dashboard/summary?laboratory_id=&device_type_id= (Figma 2.0 a 2.2).
    Los indicadores son globales; los filtros solo cambian las columnas de riesgo y las incidencias abiertas."""

    def get(self, request):
        now = timezone.now()
        laboratory_id = request.query_params.get('laboratory_id')
        device_type_id = request.query_params.get('device_type_id')

        def filtered(queryset, prefix):
            if laboratory_id and laboratory_id.isdigit():
                queryset = queryset.filter(**{f'{prefix}laboratory_id': laboratory_id})
            if device_type_id and device_type_id.isdigit():
                queryset = queryset.filter(**{f'{prefix}device_type_id': device_type_id})
            return queryset

        open_incidents = Incident.objects.filter(is_active=True, incident_status__code=IncidentStatus.OPEN)
        recently_closed = Incident.objects.filter(
            is_active=True,
            closed_at__gte=now - timedelta(days=AVERAGE_WINDOW_DAYS),
            resolution_time_minutes__isnull=False,
        )
        avg_minutes = recently_closed.aggregate(value=Avg('resolution_time_minutes'))['value']
        results = current_results()
        run = latest_run()

        centroids = {}
        if run:
            centroids = {centroid.risk_level_id: centroid for centroid in run.centroids.all()}
        groups = []
        for level in RiskLevel.objects.order_by('id'):
            # Más incidencias primero y, a igual cantidad, la falla más reciente.
            level_results = sorted(
                filtered(results.filter(risk_level=level), 'device__'),
                key=lambda r: (-r.incident_count, r.days_since_last_failure is None, r.days_since_last_failure or 0),
            )
            centroid = centroids.get(level.id)
            groups.append({
                'risk_level': RiskLevelSerializer(level).data,
                # Perfil promedio del grupo (centroide del modelo); no cambia con los filtros.
                'profile': centroid_profile(centroid) if centroid else None,
                'devices': [risk_item(result) for result in level_results],
            })

        return Response({
            'indicators': {
                'open_incident_count': open_incidents.count(),
                'open_high_priority_count': open_incidents.filter(priority=Incident.Priority.HIGH).count(),
                'avg_resolution_minutes': round(avg_minutes) if avg_minutes is not None else None,
                'high_risk_device_count': results.filter(risk_level__code='HIGH').count(),
                'active_device_count': Device.objects.filter(
                    is_active=True, device_status__code=DeviceStatus.ACTIVE
                ).count(),
            },
            'last_run': {
                'finished_at': run.finished_at,
                'kmeans_device_count': results.filter(classification_method='KMEANS').count(),
                'insufficient_history_count': results.filter(classification_method='INSUFFICIENT_HISTORY').count(),
            } if run else None,
            'risk_groups': groups,
            'open_incidents': [
                {
                    'id': incident.id,
                    'incident_number': incident.incident_number,
                    'device_code': incident.device.code,
                    'component_name': incident.component.name,
                    'priority': incident.priority,
                    'opened_at': incident.opened_at,
                }
                for incident in filtered(open_incidents, 'device__')
                .select_related('device', 'component')
                .order_by('-opened_at')
            ],
            # Referencia para los tiempos relativos ("hace 1 h").
            'generated_at': now,
        })
