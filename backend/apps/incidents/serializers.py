from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from apps.infrastructure.models import Device, DeviceStatus

from .models import Component, Incident, ResolutionAction

# Margen para la hora del navegador: unos segundos de diferencia con el servidor no hacen "futura" una fecha.
CLOCK_TOLERANCE = timedelta(minutes=1)


def _check_length(value, minimum, maximum, label):
    text = value.strip()
    if len(text) < minimum:
        raise serializers.ValidationError(f'{label} debe tener al menos {minimum} caracteres')
    if len(text) > maximum:
        raise serializers.ValidationError(f'{label} debe tener como máximo {maximum} caracteres')
    return text


def _not_future(value, message):
    if value > timezone.now() + CLOCK_TOLERANCE:
        raise serializers.ValidationError(message)
    return value


def eligible_devices():
    """RN-13: equipos activos y vigentes, de un laboratorio activo y de un tipo seleccionado."""
    return Device.objects.filter(
        is_active=True,
        device_status__code=DeviceStatus.ACTIVE,
        laboratory__is_active=True,
        device_type__is_selected=True,
    )


class IncidentCreateSerializer(serializers.ModelSerializer):
    """Registrar una incidencia (Figma 3.3 a 3.5). El número y quien la registra los pone el backend."""

    device_id = serializers.PrimaryKeyRelatedField(source='device', queryset=Device.objects.all())
    component_id = serializers.PrimaryKeyRelatedField(source='component', queryset=Component.objects.all())

    class Meta:
        model = Incident
        fields = ['device_id', 'component_id', 'priority', 'opened_at', 'description']

    def validate_device_id(self, device):
        if not eligible_devices().filter(pk=device.pk).exists():
            raise serializers.ValidationError('El equipo no admite incidencias: está retirado, su laboratorio está '
                                              'desactivado o su tipo no está seleccionado')
        return device

    def validate_component_id(self, component):
        if not component.is_active:
            raise serializers.ValidationError('El componente no está disponible')
        return component

    def validate_opened_at(self, value):
        return _not_future(value, 'La fecha de la falla no puede ser futura')  # RN-16

    def validate(self, attrs):
        # RN-16: entre 10 y 500 caracteres; D-24: con "Otro", al menos 20 para explicar qué falló.
        minimum = 20 if attrs['component'].code == 'OTHER' else 10
        try:
            attrs['description'] = _check_length(attrs['description'], minimum, 500, 'La descripción')
        except serializers.ValidationError as error:
            raise serializers.ValidationError({'description': error.detail}) from error
        return attrs


class IncidentCloseSerializer(serializers.Serializer):
    """Cerrar una incidencia (Figma 3.6 a 3.8). RN-17."""

    resolution_action_id = serializers.PrimaryKeyRelatedField(queryset=ResolutionAction.objects.filter(is_active=True))
    diagnosis = serializers.CharField(trim_whitespace=False)
    notes = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    closed_at = serializers.DateTimeField()

    def validate_diagnosis(self, value):
        return _check_length(value, 10, 500, 'El diagnóstico')

    def validate_notes(self, value):
        return (value or '').strip() or None

    def validate_closed_at(self, value):
        value = _not_future(value, 'La fecha de cierre no puede ser futura')
        if value < self.context['incident'].opened_at:
            raise serializers.ValidationError('La fecha de cierre no puede ser anterior a la fecha de la falla')
        return value
