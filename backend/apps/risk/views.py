from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.permissions import IsAdmin

from .models import KmeansRun
from .services import RiskCalculationError, calculate_risk
from .summary import level_counts


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
