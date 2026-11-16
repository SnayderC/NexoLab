from django.conf import settings
from django.db import models


class BaseModel(models.Model):
    """Campos de control de todas las tablas (sección 7): estado del registro y fechas."""

    is_active = models.BooleanField(default=True, help_text='Estado del registro. false = anulado.')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditLog(BaseModel):
    """hst_audit_logs (D-52): bitácora de los cambios administrativos. Quién hizo qué, sobre qué y qué cambió.
    Solo se agregan filas; nunca se editan ni se borran desde la aplicación. created_at es el momento del cambio."""

    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Creó'
        UPDATE = 'UPDATE', 'Editó'
        ACTIVATE = 'ACTIVATE', 'Activó'
        DEACTIVATE = 'DEACTIVATE', 'Desactivó'
        RESET_PASSWORD = 'RESET_PASSWORD', 'Restableció la contraseña'
        RETIRE = 'RETIRE', 'Retiró'
        CATALOG_SELECTION = 'CATALOG_SELECTION', 'Guardó la selección del catálogo'
        VOID = 'VOID', 'Anuló'
        TECHNICIAN_MODE_ON = 'TECHNICIAN_MODE_ON', 'Activó el modo técnico'
        TECHNICIAN_MODE_OFF = 'TECHNICIAN_MODE_OFF', 'Volvió al modo administrador'

    class EntityType(models.TextChoices):
        USER = 'USER', 'Usuario'
        LABORATORY = 'LABORATORY', 'Laboratorio'
        DEVICE = 'DEVICE', 'Equipo'
        DEVICE_TYPE = 'DEVICE_TYPE', 'Catálogo de equipos'
        INCIDENT = 'INCIDENT', 'Incidencia'

    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=Action.choices)
    entity_type = models.CharField(max_length=30, choices=EntityType.choices)
    entity_id = models.BigIntegerField(null=True, blank=True)
    # Texto legible del elemento al momento del cambio (código, correo o número), aunque luego cambie.
    entity_label = models.CharField(max_length=150)
    # {"campo": [antes, después]} o, para el catálogo, {"agregados": [...], "quitados": [...]}.
    changes = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'hst_audit_logs'
        indexes = [
            models.Index(fields=['-created_at'], name='idx_hst_audit_created'),
            models.Index(fields=['entity_type', 'entity_id'], name='idx_hst_audit_entity'),
        ]
