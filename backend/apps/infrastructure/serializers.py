from rest_framework import serializers

from apps.users.models import Role, User

from .models import Laboratory


class LaboratoryListSerializer(serializers.ModelSerializer):
    """Laboratorio con lo que muestra la tabla del Figma 5.0. Los conteos vienen anotados
    en la consulta (selectors.laboratories_with_counts) y la composición por tipo, del contexto."""

    responsible_technician_id = serializers.IntegerField(read_only=True)
    responsible_name = serializers.SerializerMethodField()
    active_device_count = serializers.IntegerField(read_only=True)
    open_incident_count = serializers.IntegerField(read_only=True)
    device_counts = serializers.SerializerMethodField()

    class Meta:
        model = Laboratory
        fields = [
            'id',
            'code',
            'name',
            'location',
            'station_count',
            'responsible_technician_id',
            'responsible_name',
            'active_device_count',
            'device_counts',
            'open_incident_count',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def get_responsible_name(self, laboratory):
        technician = laboratory.responsible_technician
        return f'{technician.first_name} {technician.last_name}' if technician else None

    def get_device_counts(self, laboratory):
        return self.context['device_counts'].get(laboratory.id, [])


class LaboratoryWriteSerializer(serializers.ModelSerializer):
    """Crear y editar un laboratorio (Figma 5.1 y 5.2). RN-10 se valida en la vista."""

    responsible_technician_id = serializers.PrimaryKeyRelatedField(
        source='responsible_technician', queryset=User.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = Laboratory
        fields = ['code', 'name', 'location', 'station_count', 'responsible_technician_id', 'is_active']
        extra_kwargs = {
            # La unicidad se valida sin distinguir mayúsculas en validate_code.
            'code': {'validators': []},
            'station_count': {
                'min_value': 1,
                'max_value': 32767,
                'error_messages': {'min_value': 'Debe tener al menos 1 puesto'},
            },
        }

    def validate_code(self, value):
        code = value.strip().upper()
        duplicates = Laboratory.objects.filter(code__iexact=code)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError(f'Ya existe un laboratorio con el código {code}')
        return code

    def validate_responsible_technician_id(self, user):
        # Se puede conservar el responsable actual aunque ya no esté activo.
        if user is None or (self.instance and user == self.instance.responsible_technician):
            return user
        if user.role.code != Role.TECHNICIAN or not user.is_active:
            raise serializers.ValidationError('El responsable debe ser un técnico activo')
        return user

    def validate_location(self, value):
        # Una ubicación vacía se guarda como NULL.
        value = (value or '').strip()
        return value or None
