from rest_framework import authentication


class SessionAuthentication(authentication.SessionAuthentication):
    """La sesión de Django de DRF, pero sin sesión responde 401 en lugar de 403 (D-47).

    DRF solo usa 401 si la autenticación declara una cabecera WWW-Authenticate. Con 401 el frontend distingue
    "la sesión venció" (lleva al login) de "no tienes permiso" (403, RN-06). El valor "Session" no es un esquema
    del navegador, así que no aparece la ventana de usuario y contraseña del navegador.
    """

    def authenticate_header(self, request):
        return 'Session'
