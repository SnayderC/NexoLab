from django.contrib.auth import login, logout, update_session_auth_hash
from django.db.models import Count, Prefetch, Q
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.infrastructure.models import Laboratory

from .models import User
from .permissions import IsAdmin
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    ResetPasswordSerializer,
    SessionUserSerializer,
    UserListSerializer,
    UserWriteSerializer,
)

# RN-01: un único mensaje para cualquier fallo de credenciales.
INVALID_CREDENTIALS = 'Correo o contraseña incorrectos'
# RN-02
ACCOUNT_DISABLED = 'Tu cuenta está desactivada. Contacta al administrador.'
# RN-05
SELF_DEACTIVATION = 'No puedes desactivar tu propia cuenta'


@method_decorator(ensure_csrf_cookie, name='get')
class CsrfView(APIView):
    """GET auth/csrf: entrega la cookie csrftoken antes del login."""

    permission_classes = [AllowAny]

    def get(self, request):
        return Response(status=status.HTTP_204_NO_CONTENT)


@method_decorator(csrf_protect, name='post')
class LoginView(APIView):
    """POST auth/login: inicia la sesión con correo y contraseña."""

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                {'detail': INVALID_CREDENTIALS, 'code': 'invalid_credentials'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = serializer.validated_data['email'].strip().lower()
        password = serializer.validated_data['password']
        user = User.objects.select_related('role').filter(email__iexact=email).first()

        if user is None:
            # Calcula un hash igual para que el tiempo de respuesta no revele si el correo existe.
            User().set_password(password)
            return Response(
                {'detail': INVALID_CREDENTIALS, 'code': 'invalid_credentials'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not user.check_password(password):
            return Response(
                {'detail': INVALID_CREDENTIALS, 'code': 'invalid_credentials'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # RN-02: se revisa después de la contraseña para no revelar qué correos existen.
        if not user.is_active:
            return Response(
                {'detail': ACCOUNT_DISABLED, 'code': 'account_disabled'},
                status=status.HTTP_403_FORBIDDEN,
            )

        login(request, user)  # también actualiza last_login_at
        return Response(SessionUserSerializer(user).data)


class LogoutView(APIView):
    """POST auth/logout: cierra la sesión."""

    def post(self, request):
        logout(request)
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(APIView):
    """GET auth/me: usuario de la sesión. 403 si no hay sesión."""

    def get(self, request):
        return Response(SessionUserSerializer(request.user).data)


class ChangePasswordView(APIView):
    """POST auth/change-password: Mi perfil › Cambiar contraseña (RN-04)."""

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password', 'updated_at'])
        # Mantiene abierta la sesión actual después de cambiar la contraseña.
        update_session_auth_hash(request, request.user)
        return Response(status=status.HTTP_204_NO_CONTENT)


def users_with_workload():
    """Usuarios con su rol, laboratorios activos a cargo y carga de trabajo:
    incidencias registradas y cerradas, sin contar las anuladas (RN-22)."""
    return (
        User.objects.select_related('role')
        .prefetch_related(
            Prefetch('responsible_laboratories', queryset=Laboratory.objects.filter(is_active=True).order_by('code'))
        )
        .annotate(
            registered_count=Count('reported_incidents', filter=Q(reported_incidents__is_active=True), distinct=True),
            closed_count=Count('closed_incidents', filter=Q(closed_incidents__is_active=True), distinct=True),
        )
        .order_by('id')
    )


def user_response(user_id, response_status=status.HTTP_200_OK):
    return Response(UserListSerializer(users_with_workload().get(pk=user_id)).data, status=response_status)


class UserListView(APIView):
    """GET users · POST users (solo administrador, RN-06)."""

    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(UserListSerializer(users_with_workload(), many=True).data)

    def post(self, request):
        serializer = UserWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return user_response(user.pk, status.HTTP_201_CREATED)


class UserDetailView(APIView):
    """PATCH users/{id} (administrador). La contraseña no se cambia aquí."""

    permission_classes = [IsAdmin]

    def patch(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = UserWriteSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return user_response(pk)


class UserActivationView(APIView):
    """POST users/{id}/activate · POST users/{id}/deactivate (administrador)."""

    permission_classes = [IsAdmin]
    is_active = True

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        # RN-05: nadie se desactiva a sí mismo (dejaría el sistema sin su administrador).
        if not self.is_active and user.pk == request.user.pk:
            return Response(
                {'detail': SELF_DEACTIVATION, 'code': 'self_deactivation'}, status=status.HTTP_409_CONFLICT
            )
        user.is_active = self.is_active
        user.save(update_fields=['is_active', 'updated_at'])
        return user_response(pk)


class ResetPasswordView(APIView):
    """POST users/{id}/reset-password (administrador, RN-03). El usuario desactivado sigue sin poder entrar."""

    permission_classes = [IsAdmin]

    def post(self, request, pk):
        user = get_object_or_404(User, pk=pk)
        serializer = ResetPasswordSerializer(data=request.data, context={'user': user})
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data['new_password'])
        user.save(update_fields=['password', 'updated_at'])
        return Response(status=status.HTTP_204_NO_CONTENT)
