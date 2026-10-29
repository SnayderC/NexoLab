from rest_framework.response import Response
from rest_framework.views import APIView

from apps.incidents.models import Component, IncidentStatus, ResolutionAction
from apps.infrastructure.models import DeviceStatus
from apps.risk.models import RiskLevel
from apps.users.models import Role

# Campos de control comunes de los catálogos (sección 7).
CONTROL_FIELDS = ('id', 'is_active', 'created_at', 'updated_at')


def _rows(model, *fields):
    return list(model.objects.order_by('id').values(*CONTROL_FIELDS, *fields))


class CatalogsView(APIView):
    """GET catalogs: catálogos pequeños que usan los formularios y filtros (con sesión)."""

    def get(self, request):
        return Response({
            'roles': _rows(Role, 'code', 'name'),
            'device_statuses': _rows(DeviceStatus, 'code', 'name', 'is_included_in_kmeans'),
            'components': _rows(Component, 'code', 'name'),
            'incident_statuses': _rows(IncidentStatus, 'code', 'name', 'is_final'),
            'resolution_actions': _rows(ResolutionAction, 'code', 'name', 'is_retirement_action'),
            'risk_levels': _rows(RiskLevel, 'code', 'name', 'recommended_action', 'color_hex'),
        })
