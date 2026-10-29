from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Solo el rol Administrador. Un técnico recibe 403 (RN-06)."""

    message = 'Esta sección es solo para administradores.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin)
