from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import Role, User


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'code', 'name']


class SessionUserSerializer(serializers.ModelSerializer):
    """Usuario de la sesión, con el rol unido. Los nombres coinciden con la BD (snake_case);
    nunca incluye la contraseña."""

    role = RoleSerializer(read_only=True)
    last_login_at = serializers.DateTimeField(source='last_login', read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'role_id',
            'role',
            'first_name',
            'last_name',
            'email',
            'last_login_at',
            'is_active',
            'created_at',
            'updated_at',
        ]


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(trim_whitespace=False)
    new_password = serializers.CharField(trim_whitespace=False)

    def validate_current_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('La contraseña actual no es correcta')
        return value

    def validate_new_password(self, value):
        return validate_password_for(value, self.context['request'].user)


def validate_password_for(value, user):
    """RN-04: los 4 validadores de Django, con los mensajes como lista."""
    try:
        validate_password(value, user=user)
    except DjangoValidationError as error:
        raise serializers.ValidationError(list(error.messages)) from error
    return value


class UserListSerializer(serializers.ModelSerializer):
    """Usuario de la tabla del Figma 5.15. Los conteos vienen anotados en la consulta."""

    role = RoleSerializer(read_only=True)
    last_login_at = serializers.DateTimeField(source='last_login', read_only=True)
    laboratory_codes = serializers.SerializerMethodField()
    registered_count = serializers.IntegerField(read_only=True)
    closed_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'role_id',
            'role',
            'first_name',
            'last_name',
            'email',
            'last_login_at',
            'laboratory_codes',
            'registered_count',
            'closed_count',
            'is_active',
            'created_at',
            'updated_at',
        ]

    def get_laboratory_codes(self, user):
        # Laboratorios activos de los que es responsable (prefetch en la vista).
        return [lab.code for lab in user.responsible_laboratories.all()]


class UserWriteSerializer(serializers.ModelSerializer):
    """Crear (con contraseña temporal, RN-03) y editar un usuario (Figma 5.16 y 5.17)."""

    role_id = serializers.PrimaryKeyRelatedField(source='role', queryset=Role.objects.all())
    temporary_password = serializers.CharField(write_only=True, trim_whitespace=False, required=False)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'role_id', 'temporary_password']
        extra_kwargs = {
            # La unicidad se valida sin distinguir mayúsculas en validate_email.
            'email': {'validators': []},
        }

    def validate_first_name(self, value):
        return value.strip()

    def validate_last_name(self, value):
        return value.strip()

    def validate_email(self, value):
        email = value.strip().lower()
        serializers.EmailField().run_validation(email)
        duplicates = User.objects.filter(email__iexact=email)
        if self.instance:
            duplicates = duplicates.exclude(pk=self.instance.pk)
        if duplicates.exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo')
        return email

    def validate(self, attrs):
        password = attrs.get('temporary_password')
        if self.instance is None:
            if not password:
                raise serializers.ValidationError({'temporary_password': ['Ingresa la contraseña temporal']})
            # Usuario sin guardar, para comparar la contraseña con sus nombres y correo.
            candidate = User(first_name=attrs['first_name'], last_name=attrs['last_name'], email=attrs['email'])
            try:
                validate_password_for(password, candidate)
            except serializers.ValidationError as error:
                raise serializers.ValidationError({'temporary_password': error.detail}) from error
        elif password is not None:
            raise serializers.ValidationError(
                {'temporary_password': ['La contraseña se cambia con "Restablecer contraseña"']}
            )
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('temporary_password')
        return User.objects.create_user(validated_data.pop('email'), password, **validated_data)


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(trim_whitespace=False)

    def validate_new_password(self, value):
        return validate_password_for(value, self.context['user'])
