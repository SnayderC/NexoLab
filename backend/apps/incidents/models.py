from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Component(BaseModel):
    """cat_components: componente afectado (incluye periféricos, software y red; D-02 y D-24)."""

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=80)

    class Meta:
        db_table = 'cat_components'

    def __str__(self):
        return self.name


class IncidentStatus(BaseModel):
    """cat_incident_statuses: OPEN | CLOSED."""

    OPEN = 'OPEN'
    CLOSED = 'CLOSED'

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50)
    is_final = models.BooleanField(help_text='Una incidencia en estado final ya no se modifica')

    class Meta:
        db_table = 'cat_incident_statuses'

    def __str__(self):
        return self.name


class ResolutionAction(BaseModel):
    """cat_resolution_actions: RESOLVED | REPLACEMENT_REQUIRED | REFERRED."""

    code = models.CharField(max_length=30, unique=True)
    name = models.CharField(max_length=100)
    is_retirement_action = models.BooleanField(default=False)

    class Meta:
        db_table = 'cat_resolution_actions'

    def __str__(self):
        return self.name


class Incident(BaseModel):
    """trx_incidents: registro principal de incidencias. Alimenta el modelo K-Means."""

    class Priority(models.TextChoices):
        HIGH = 'HIGH', 'Alta'
        MEDIUM = 'MEDIUM', 'Media'
        LOW = 'LOW', 'Baja'

    id = models.BigAutoField(primary_key=True)
    incident_number = models.CharField(max_length=20, unique=True, help_text='Ej.: INC-2026-0001')
    device = models.ForeignKey('infrastructure.Device', on_delete=models.PROTECT, related_name='incidents')
    component = models.ForeignKey(Component, on_delete=models.PROTECT, related_name='incidents')
    incident_status = models.ForeignKey(IncidentStatus, on_delete=models.PROTECT, related_name='incidents')
    resolution_action = models.ForeignKey(
        ResolutionAction, on_delete=models.PROTECT, null=True, blank=True, related_name='incidents'
    )
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='reported_incidents'
    )
    closed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='closed_incidents'
    )
    priority = models.CharField(max_length=10, choices=Priority.choices)
    description = models.TextField(help_text='Entre 10 y 500 caracteres')
    diagnosis = models.TextField(null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    opened_at = models.DateTimeField(help_text='Cuándo ocurrió la falla')
    closed_at = models.DateTimeField(null=True, blank=True)
    resolution_time_minutes = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'trx_incidents'
        indexes = [models.Index(fields=['device', 'opened_at'], name='idx_trx_inc_device_opened')]

    def __str__(self):
        return self.incident_number
