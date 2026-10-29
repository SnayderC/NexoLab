"""Cambios de equipos que tocan también el riesgo (RN-12, RN-23)."""

from django.db import transaction
from django.utils import timezone

from apps.risk.models import DeviceRiskResult, RiskLevel
from apps.risk.selectors import latest_run

from .models import Device, DeviceStatus


@transaction.atomic
def create_device(validated_data) -> Device:
    device = Device.objects.create(device_status=DeviceStatus.objects.get(code=DeviceStatus.ACTIVE), **validated_data)
    # RN-23: sin incidencias queda en riesgo bajo por regla. Se registra en la última ejecución
    # para que aparezca en el dashboard hasta el próximo cálculo, que lo incluye solo.
    run = latest_run()
    if run is not None:
        DeviceRiskResult.objects.create(
            kmeans_run=run,
            device=device,
            classification_method=DeviceRiskResult.ClassificationMethod.INSUFFICIENT_HISTORY,
            risk_level=RiskLevel.objects.get(code='LOW'),
            incident_count=0,
            is_current=True,
            calculated_at=timezone.now(),
        )
    return device


@transaction.atomic
def retire_device(device: Device, retired_at=None) -> None:
    """RN-12: llena retired_at y el equipo deja de tener riesgo vigente. Su historial se conserva."""
    device.device_status = DeviceStatus.objects.get(code=DeviceStatus.RETIRED)
    device.retired_at = retired_at or timezone.now()
    device.save(update_fields=['device_status', 'retired_at', 'updated_at'])
    DeviceRiskResult.objects.filter(device=device, is_current=True).update(is_current=False, updated_at=timezone.now())
