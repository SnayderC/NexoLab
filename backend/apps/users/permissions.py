from rest_framework.permissions import BasePermission

# Clave de la sesión donde se guarda el modo técnico del administrador (RN-24, D-45).
TECHNICIAN_MODE_KEY = 'technician_mode'


def is_technician_mode(request) -> bool:
    """True si un administrador activó el modo técnico en esta sesión."""
    return bool(request.user.is_admin and request.session.get(TECHNICIAN_MODE_KEY))


class IsAdmin(BasePermission):
    """Solo el rol Administrador. Un técnico recibe 403 (RN-06)."""

    message = 'Esta sección es solo para administradores.'

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and user.is_admin)


class CanOperateIncidents(BasePermission):
    """RN-24: registrar y cerrar incidencias es trabajo del técnico. Un administrador solo puede hacerlo
    con el modo técnico activo; sin él recibe 403."""

    message = 'Activa el modo técnico para registrar o cerrar incidencias.'

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return not user.is_admin or is_technician_mode(request)
