from django.utils.dateparse import parse_date
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.incidents.models import Component, IncidentStatus, ResolutionAction
from apps.infrastructure.models import DeviceStatus
from apps.risk.models import RiskLevel
from apps.users.models import Role
from apps.users.permissions import IsAdmin

from . import audit
from .models import AuditLog

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


# ---------- Bitácora de cambios administrativos (D-52) ----------

AUDIT_PAGE_SIZE = 20


def _audit_item(log):
    """Una entrada con los textos en español para la pantalla Bitácora."""
    changes = log.changes or {}
    if log.action == AuditLog.Action.CATALOG_SELECTION:
        rows = [
            {'field': key, 'label': audit.FIELD_LABELS[key], 'before': None, 'after': ', '.join(values)}
            for key, values in changes.items() if values
        ]
    else:
        rows = [
            {'field': field, 'label': audit.FIELD_LABELS.get(field, field), 'before': values[0], 'after': values[1]}
            for field, values in changes.items()
        ]
    return {
        'id': log.id,
        'created_at': log.created_at,
        'user_id': log.user_id,
        'user_name': str(log.user),
        'action': log.action,
        'action_name': log.get_action_display(),
        'entity_type': log.entity_type,
        'entity_type_name': log.get_entity_type_display(),
        'entity_id': log.entity_id,
        'entity_label': log.entity_label,
        'changes': rows,
    }


class AuditLogListView(APIView):
    """GET audit-logs (administrador): la bitácora, del cambio más reciente al más antiguo, en páginas de 20.
    Filtros: entity_type, user_id, from y to (aaaa-mm-dd, hora de Ecuador)."""

    permission_classes = [IsAdmin]

    def get(self, request):
        params = request.query_params
        logs = AuditLog.objects.select_related('user').order_by('-created_at', '-id')
        if params.get('entity_type') in AuditLog.EntityType.values:
            logs = logs.filter(entity_type=params['entity_type'])
        if params.get('user_id', '').isdigit():
            logs = logs.filter(user_id=params['user_id'])
        if date_from := parse_date(params.get('from') or ''):
            logs = logs.filter(created_at__date__gte=date_from)
        if date_to := parse_date(params.get('to') or ''):
            logs = logs.filter(created_at__date__lte=date_to)
        page = max(int(params['page']) if params.get('page', '').isdigit() else 1, 1)
        start = (page - 1) * AUDIT_PAGE_SIZE
        return Response({
            'items': [_audit_item(log) for log in logs[start:start + AUDIT_PAGE_SIZE]],
            'total': logs.count(),
            'entity_types': [{'value': value, 'label': label} for value, label in AuditLog.EntityType.choices],
        })
