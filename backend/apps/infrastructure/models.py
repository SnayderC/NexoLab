from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class DeviceType(BaseModel):
    """cat_device_types: catálogo ampliable. Solo los seleccionados entran a formularios y riesgo (RN-07)."""

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=80)
    is_selected = models.BooleanField(default=False)

    class Meta:
        db_table = 'cat_device_types'

    def __str__(self):
        return self.name


class DeviceStatus(BaseModel):
    """cat_device_statuses: ACTIVE | RETIRED."""

    ACTIVE = 'ACTIVE'
    RETIRED = 'RETIRED'

    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=50)
    is_included_in_kmeans = models.BooleanField()

    class Meta:
        db_table = 'cat_device_statuses'

    def __str__(self):
        return self.name


class Laboratory(BaseModel):
    """mst_laboratories."""

    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    location = models.CharField(max_length=150, null=True, blank=True)
    station_count = models.SmallIntegerField(help_text='Puestos de trabajo (no equipos)')
    responsible_technician = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name='responsible_laboratories',
    )

    class Meta:
        db_table = 'mst_laboratories'

    def __str__(self):
        return self.code


class Device(BaseModel):
    """mst_devices. El riesgo se guarda en hst_device_risk_results."""

    code = models.CharField(max_length=30, unique=True, help_text='Ej.: H103-PC-03')
    laboratory = models.ForeignKey(Laboratory, on_delete=models.PROTECT, related_name='devices')
    device_type = models.ForeignKey(DeviceType, on_delete=models.PROTECT, related_name='devices')
    device_status = models.ForeignKey(DeviceStatus, on_delete=models.PROTECT, related_name='devices')
    physical_location = models.CharField(max_length=100, null=True, blank=True)
    specifications = models.TextField(null=True, blank=True)
    retired_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'mst_devices'

    def __str__(self):
        return self.code
