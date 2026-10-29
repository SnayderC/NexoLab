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
        # RN-04: los 4 validadores de Django, incluida la similitud con los datos del usuario.
        try:
            validate_password(value, user=self.context['request'].user)
        except DjangoValidationError as error:
            raise serializers.ValidationError(list(error.messages)) from error
        return value


class UserListSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    last_login_at = serializers.DateTimeField(source='last_login', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'role', 'first_name', 'last_name', 'email', 'last_login_at', 'is_active']
