"""
RN-25 (D-46): límite de intentos fallidos de inicio de sesión.

Tras LOGIN_MAX_FAILED_ATTEMPTS intentos fallidos con el mismo correo desde la misma dirección, el login queda
bloqueado LOGIN_LOCKOUT_MINUTES minutos, aunque la contraseña sea correcta. Así nadie puede probar contraseñas sin
parar. Se cuenta por correo + dirección (y no solo por correo) para que un tercero no pueda bloquear la cuenta de
otra persona desde otra computadora. El correo no tiene que existir: el bloqueo es igual para todos (RN-01).

Usa la caché de Django; no necesita tablas ni dependencias nuevas.
"""

import math
import time

from django.conf import settings
from django.core.cache import cache


def _key(request, email):
    return f'login-failures:{request.META.get("REMOTE_ADDR", "")}:{email}'


def minutes_locked(request, email) -> int:
    """Minutos que faltan para volver a intentar; 0 si no está bloqueado."""
    entry = cache.get(_key(request, email))
    if not entry or entry['count'] < settings.LOGIN_MAX_FAILED_ATTEMPTS:
        return 0
    return max(math.ceil((entry['until'] - time.time()) / 60), 1)


def register_failure(request, email) -> None:
    key = _key(request, email)
    entry = cache.get(key) or {'count': 0}
    entry['count'] += 1
    # Cada fallo reinicia la ventana: el bloqueo dura LOGIN_LOCKOUT_MINUTES desde el último intento.
    seconds = settings.LOGIN_LOCKOUT_MINUTES * 60
    entry['until'] = time.time() + seconds
    cache.set(key, entry, timeout=seconds)


def clear_failures(request, email) -> None:
    cache.delete(_key(request, email))
