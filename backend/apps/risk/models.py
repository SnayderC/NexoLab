from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class RiskLevel(BaseModel):
    """cat_risk_levels: HIGH | MEDIUM | LOW."""

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)
    recommended_action = models.CharField(max_length=150, null=True, blank=True)
    color_hex = models.CharField(max_length=7, null=True, blank=True)

    class Meta:
        db_table = 'cat_risk_levels'

    def __str__(self):
        return self.name


class KmeansRun(BaseModel):
    """hst_kmeans_runs: bitácora de cada ejecución del modelo (trazabilidad y reproducibilidad)."""

    class TriggerType(models.TextChoices):
        INITIAL_LOAD = 'INITIAL_LOAD'
        INCIDENT_CLOSED = 'INCIDENT_CLOSED'
        CATALOG_CHANGE = 'CATALOG_CHANGE'
        MANUAL = 'MANUAL'

    class RunStatus(models.TextChoices):
        RUNNING = 'RUNNING'
        COMPLETED = 'COMPLETED'
        FAILED = 'FAILED'

    id = models.BigAutoField(primary_key=True)
    trigger_type = models.CharField(max_length=30, choices=TriggerType.choices)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='kmeans_runs'
    )
    incident = models.ForeignKey(
        'incidents.Incident', on_delete=models.PROTECT, null=True, blank=True, related_name='kmeans_runs'
    )
    run_status = models.CharField(max_length=15, choices=RunStatus.choices)
    cluster_count = models.SmallIntegerField(default=3)
    max_iterations = models.IntegerField(default=100)
    iteration_count = models.IntegerField(null=True, blank=True)
    has_converged = models.BooleanField(null=True, blank=True)
    random_seed = models.IntegerField()
    device_count = models.IntegerField(null=True, blank=True)
    inertia = models.DecimalField(max_digits=14, decimal_places=4, null=True, blank=True)
    silhouette_score = models.DecimalField(max_digits=6, decimal_places=5, null=True, blank=True)
    davies_bouldin_index = models.DecimalField(max_digits=10, decimal_places=5, null=True, blank=True)
    parameters = models.JSONField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    duration_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'hst_kmeans_runs'


class KmeansCentroid(BaseModel):
    """hst_kmeans_centroids: perfil promedio de cada grupo en una ejecución."""

    id = models.BigAutoField(primary_key=True)
    kmeans_run = models.ForeignKey(KmeansRun, on_delete=models.PROTECT, related_name='centroids')
    cluster_index = models.SmallIntegerField()
    risk_level = models.ForeignKey(RiskLevel, on_delete=models.PROTECT, related_name='centroids')
    avg_incident_count = models.DecimalField(max_digits=10, decimal_places=4)
    avg_days_since_last_failure = models.DecimalField(max_digits=10, decimal_places=4)
    avg_failure_interval_days = models.DecimalField(max_digits=10, decimal_places=4)
    device_count = models.IntegerField()

    class Meta:
        db_table = 'hst_kmeans_centroids'
        constraints = [
            # Nombre corto para cumplir el límite de 30 caracteres de la sección 7 (D-26).
            models.UniqueConstraint(fields=['kmeans_run', 'cluster_index'], name='uq_hst_kmc_run_cluster'),
        ]


class DeviceRiskResult(BaseModel):
    """hst_device_risk_results: nivel de riesgo de cada equipo en cada ejecución (con historial)."""

    class ClassificationMethod(models.TextChoices):
        KMEANS = 'KMEANS'
        INSUFFICIENT_HISTORY = 'INSUFFICIENT_HISTORY'

    id = models.BigAutoField(primary_key=True)
    kmeans_run = models.ForeignKey(KmeansRun, on_delete=models.PROTECT, related_name='results')
    device = models.ForeignKey('infrastructure.Device', on_delete=models.PROTECT, related_name='risk_results')
    classification_method = models.CharField(max_length=25, choices=ClassificationMethod.choices)
    kmeans_centroid = models.ForeignKey(
        KmeansCentroid, on_delete=models.PROTECT, null=True, blank=True, related_name='results'
    )
    risk_level = models.ForeignKey(RiskLevel, on_delete=models.PROTECT, related_name='results')
    incident_count = models.IntegerField()
    days_since_last_failure = models.IntegerField(null=True, blank=True)
    avg_failure_interval_days = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    distance_to_centroid = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    is_current = models.BooleanField(default=False, help_text='Resultado vigente: el que muestra el dashboard')
    calculated_at = models.DateTimeField()

    class Meta:
        db_table = 'hst_device_risk_results'
