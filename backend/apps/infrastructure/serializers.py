import re

from rest_framework import serializers

from apps.users.models import Role, User

from .models import Device, DeviceStatus, DeviceType, Laboratory


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


class DeviceTypeSerializer(serializers.ModelSerializer):
    """Tipo del catálogo (Figma 5.9). active_device_count viene anotado en la consulta."""

    active_device_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DeviceType
        fields = ['id', 'code', 'name', 'is_selected', 'is_active', 'active_device_count']


# D-37: el código del tipo es parte del código del equipo (RN-11), por eso tiene de 2 a 5 letras.
TYPE_CODE_PATTERN = re.compile(r'^[A-Z]{2,5}$')


class DeviceTypeCreateSerializer(serializers.ModelSerializer):
    """Agregar un tipo al catálogo (Figma 5.10). RN-09: entra sin seleccionar."""

    class Meta:
        model = DeviceType
        fields = ['code', 'name']
        extra_kwargs = {'code': {'validators': []}}

    def validate_code(self, value):
        code = value.strip().upper()
        if not TYPE_CODE_PATTERN.match(code):
            raise serializers.ValidationError('El código debe tener de 2 a 5 letras, sin números ni espacios')
        if DeviceType.objects.filter(code__iexact=code).exists():
            raise serializers.ValidationError(f'Ya existe un tipo con el código {code}')
        return code

    def validate_name(self, value):
        return value.strip()

    def create(self, validated_data):
        return DeviceType.objects.create(is_selected=False, **validated_data)


class DeviceTypeSelectionSerializer(serializers.Serializer):
    """Tipos seleccionados del catálogo (RN-07: al menos uno)."""

    selected_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=True)

    def validate_selected_ids(self, ids):
        ids = set(ids)
        if not ids:
            raise serializers.ValidationError('Selecciona al menos un tipo de equipo')
        if DeviceType.objects.filter(id__in=ids, is_active=True).count() != len(ids):
            raise serializers.ValidationError('Hay tipos que no existen en el catálogo')
        return ids


# RN-11 (D-43): formato LAB-TIPO-NN. LAB es el código del laboratorio, sea cual sea (H103, H106A, LAB-2);
# TIPO, el código del tipo (2 a 5 letras), y NN, un número de 2 o 3 cifras. D-21 exige además que empiece
# con el laboratorio y el tipo elegidos.
DEVICE_CODE_PATTERN = re.compile(r'^[A-Z0-9][A-Z0-9-]{0,9}-[A-Z]{2,5}-\d{2,3}$')
FORMAT_MESSAGE = 'El código debe tener el formato LAB-TIPO-NN, por ejemplo H103-PC-13 o H106A-PC-05'


class DeviceCreateSerializer(serializers.ModelSerializer):
    """Nuevo equipo (Figma 5.6 y 5.7). Siempre empieza activo."""

    laboratory_id = serializers.PrimaryKeyRelatedField(source='laboratory', queryset=Laboratory.objects.all())
    device_type_id = serializers.PrimaryKeyRelatedField(source='device_type', queryset=DeviceType.objects.all())

    class Meta:
        model = Device
        fields = ['code', 'laboratory_id', 'device_type_id', 'physical_location', 'specifications']
        extra_kwargs = {'code': {'validators': []}}

    def validate_code(self, value):
        code = value.strip().upper()
        if not DEVICE_CODE_PATTERN.match(code):
            raise serializers.ValidationError(FORMAT_MESSAGE)
        existing = Device.objects.filter(code__iexact=code).first()
        if existing and not existing.is_active:
            # RN-26: el código de un equipo anulado queda reservado (es único en la base y figura en la bitácora).
            raise serializers.ValidationError(f'El código {code} perteneció a un equipo anulado. Usa otro número.')
        if existing:
            raise serializers.ValidationError(f'Ya existe un equipo con el código {code}')
        return code

    def validate_laboratory_id(self, laboratory):
        if not laboratory.is_active:
            raise serializers.ValidationError('El laboratorio está desactivado')
        return laboratory

    def validate_device_type_id(self, device_type):
        # RN-07: solo los tipos seleccionados aparecen en los formularios.
        if not device_type.is_selected or not device_type.is_active:
            raise serializers.ValidationError('El tipo no está seleccionado en el catálogo')
        return device_type

    def validate(self, attrs):
        # D-21: el código empieza con el laboratorio y el tipo elegidos.
        prefix = f"{attrs['laboratory'].code}-{attrs['device_type'].code}-"
        if not attrs['code'].startswith(prefix):
            raise serializers.ValidationError({'code': [f'El código debe empezar con {prefix}']})
        return attrs

    def validate_physical_location(self, value):
        return (value or '').strip() or None

    def validate_specifications(self, value):
        return (value or '').strip() or None


class DeviceUpdateSerializer(serializers.Serializer):
    """Editar un equipo (Figma 5.8). D-20: el código, el laboratorio y el tipo no cambian;
    pasar a RETIRED lo retira (RN-12) y un retirado no vuelve a activo."""

    physical_location = serializers.CharField(max_length=100, allow_blank=True, allow_null=True, required=False)
    specifications = serializers.CharField(allow_blank=True, allow_null=True, required=False)
    status = serializers.ChoiceField(choices=[DeviceStatus.ACTIVE, DeviceStatus.RETIRED], required=False)

    def validate_physical_location(self, value):
        return (value or '').strip() or None

    def validate_specifications(self, value):
        return (value or '').strip() or None

    def validate_status(self, value):
        if self.instance.device_status.code == DeviceStatus.RETIRED and value == DeviceStatus.ACTIVE:
            raise serializers.ValidationError('Un equipo retirado no vuelve a activarse')
        return value
