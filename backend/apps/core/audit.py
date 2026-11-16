"""
Bitácora de cambios administrativos (D-52, tabla hst_audit_logs).

Uso, dentro de la misma transacción que el cambio (si el cambio se deshace, la entrada también):

    with transaction.atomic():
        before = audit.snapshot(user, audit.USER_FIELDS)
        ...guardar...
        changes = audit.diff(before, audit.snapshot(user, audit.USER_FIELDS))
        audit.record(request.user, audit.Action.UPDATE, audit.EntityType.USER, user, changes=changes)

Nunca se guardan contraseñas ni sus hashes.
"""

from .models import AuditLog

Action = AuditLog.Action
EntityType = AuditLog.EntityType

# Campos que se comparan al editar cada tipo de elemento (nunca la contraseña).
USER_FIELDS = ['first_name', 'last_name', 'email', 'role', 'is_active']
LABORATORY_FIELDS = ['code', 'name', 'location', 'station_count', 'responsible_technician', 'is_active']
DEVICE_FIELDS = ['physical_location', 'specifications', 'device_status']

# Nombres en español de los campos, para la pantalla Bitácora.
FIELD_LABELS = {
    'first_name': 'Nombres',
    'last_name': 'Apellidos',
    'email': 'Correo',
    'role': 'Rol',
    'is_active': 'Activo',
    'code': 'Código',
    'name': 'Nombre',
    'location': 'Ubicación',
    'station_count': 'Puestos',
    'responsible_technician': 'Responsable',
    'physical_location': 'Ubicación',
    'specifications': 'Especificaciones',
    'device_status': 'Estado',
    'laboratory': 'Laboratorio',
    'device_type': 'Tipo',
    'added': 'Seleccionados',
    'removed': 'Quitados',
}


def _readable(value):
    """Valor legible y que se puede guardar en JSON: un objeto relacionado se guarda por su nombre o código."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    return str(getattr(value, 'name', None) or value)


def snapshot(instance, fields):
    return {field: _readable(getattr(instance, field)) for field in fields}


def diff(before, after):
    """Solo los campos que cambiaron: {"campo": [antes, después]}. None si no cambió nada."""
    changes = {field: [before[field], after[field]] for field in after if before.get(field) != after[field]}
    return changes or None


def created(instance, fields):
    """Al crear, cada campo pasa de vacío a su valor."""
    return {field: [None, value] for field, value in snapshot(instance, fields).items() if value not in (None, '')}


def label_for(instance):
    """Texto que identifica al elemento en la bitácora."""
    for attribute in ('incident_number', 'code', 'email'):
        if value := getattr(instance, attribute, None):
            return str(value)
    return str(instance)


def record(user, action, entity_type, instance=None, *, label=None, changes=None):
    return AuditLog.objects.create(
        user=user,
        action=action,
        entity_type=entity_type,
        entity_id=getattr(instance, 'pk', None),
        entity_label=label or (label_for(instance) if instance is not None else ''),
        changes=changes,
    )
