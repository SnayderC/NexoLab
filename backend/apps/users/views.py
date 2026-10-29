from django.contrib.auth import login, logout, update_session_auth_hash
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsAdmin
from .serializers import ChangePasswordSerializer, LoginSerializer, SessionUserSerializer, UserListSerializer

# RN-01: un único mensaje para cualquier fallo de credenciales.
INVALID_CREDENTIALS = 'Correo o contraseña incorrectos'
# RN-02
ACCOUNT_DISABLED = 'Tu cuenta está desactivada. Contacta al administrador.'


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


class UserListView(APIView):
    """GET users: lista de usuarios (solo administrador, RN-06)."""

    permission_classes = [IsAdmin]

    def get(self, request):
        users = User.objects.select_related('role').order_by('id')
        return Response(UserListSerializer(users, many=True).data)
