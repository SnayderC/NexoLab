"""
Configuración de Django para NexoLab.

Los valores sensibles y los que cambian por entorno se leen de backend/.env
(ver backend/.env.example). Nunca se escriben credenciales en este archivo.
"""

import sys
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
    CSRF_TRUSTED_ORIGINS=(list, ['http://localhost:5173']),
    RISK_MIN_OWN_HISTORY_DEVICES=(int, 30),
    LOGIN_MAX_FAILED_ATTEMPTS=(int, 5),
    LOGIN_LOCKOUT_MINUTES=(int, 15),
    REDIS_URL=(str, ''),
    RISK_RECALC_MINUTES=(int, 15),
)
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

INSTALLED_APPS = [
    # Django: solo lo necesario para usuarios, sesiones y la API (sin el panel de administración).
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'rest_framework',
    # Aplicaciones de NexoLab (sección 6).
    'apps.core',
    'apps.users',
    'apps.infrastructure',
    'apps.incidents',
    'apps.risk',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {'context_processors': ['django.template.context_processors.request']},
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# PostgreSQL 17 en Docker (docker-compose.yml). Ej.: postgres://nexolab:clave@localhost:5433/nexolab
DATABASES = {'default': env.db('DATABASE_URL')}

# Llaves primarias integer por defecto, como en el DBML; las tablas bigint lo declaran en su modelo.
DEFAULT_AUTO_FIELD = 'django.db.models.AutoField'

# mst_users reemplaza al usuario de Django (login por correo).
AUTH_USER_MODEL = 'users.User'

# RN-04: los 4 validadores de contraseña de Django.
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 8}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Español de Ecuador y hora de Ecuador; las fechas se guardan con zona horaria (timestamptz).
LANGUAGE_CODE = 'es-ec'
TIME_ZONE = 'America/Guayaquil'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

# Sesión de Django con cookie httpOnly y protección CSRF (decisión D-25).
# El frontend llega por el proxy de Vite, así que las cookies son del mismo origen.
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_AGE = 60 * 60 * 8  # una jornada de 8 horas
CSRF_COOKIE_HTTPONLY = False  # el frontend lee el token para enviarlo en la cabecera X-CSRFToken
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_TRUSTED_ORIGINS = env('CSRF_TRUSTED_ORIGINS')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG

REST_FRAMEWORK = {
    # Sesión de Django; sin sesión la API responde 401 para que el frontend lleve al login (D-47).
    'DEFAULT_AUTHENTICATION_CLASSES': ['apps.users.authentication.SessionAuthentication'],
    # Toda la API requiere sesión, salvo lo que se declare público (login, csrf).
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_PARSER_CLASSES': ['rest_framework.parsers.JSONParser'],
    'UNAUTHENTICATED_USER': None,
}

# K-Means (sección 10, D-33): equipos con historial propio necesarios para dejar de usar el modelo de Kaggle.
# Se ajusta por instalación en .env según el tamaño de los laboratorios.
RISK_MIN_OWN_HISTORY_DEVICES = env('RISK_MIN_OWN_HISTORY_DEVICES')

# RN-25 (D-46): intentos fallidos de login antes de bloquear, y minutos de bloqueo.
LOGIN_MAX_FAILED_ATTEMPTS = env('LOGIN_MAX_FAILED_ATTEMPTS')
LOGIN_LOCKOUT_MINUTES = env('LOGIN_LOCKOUT_MINUTES')

# ---------- Celery y Redis (D-55): K-Means en segundo plano y recálculo programado ----------
# REDIS_URL lo define Docker Compose (redis://redis:6379/0). Sin él, o al correr las pruebas, las tareas se ejecutan
# en el mismo proceso (modo "eager"): todo funciona igual, solo que no en segundo plano.
TESTING = len(sys.argv) > 1 and sys.argv[1] == 'test'
CELERY_BROKER_URL = env('REDIS_URL') or 'memory://'
CELERY_TASK_ALWAYS_EAGER = TESTING or not env('REDIS_URL')
CELERY_TASK_IGNORE_RESULT = True
CELERY_TIMEZONE = TIME_ZONE
# Si Redis no responde, se avisa enseguida (sin reintentos largos) y el cálculo se hace en el momento.
CELERY_TASK_PUBLISH_RETRY = False
# Sin reintentos al publicar; el worker sí se reconecta solo si Redis se reinicia.
CELERY_BROKER_CONNECTION_TIMEOUT = 1
CELERY_BROKER_TRANSPORT_OPTIONS = {'socket_connect_timeout': 1, 'socket_timeout': 2}
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
# RF11: recálculo programado cada RISK_RECALC_MINUTES minutos (15 por defecto). Actualiza, por ejemplo, los
# "días desde la última falla" aunque nadie registre nada.
RISK_RECALC_MINUTES = env('RISK_RECALC_MINUTES')
CELERY_BEAT_SCHEDULE = {
    'recalcular-riesgo-programado': {
        'task': 'apps.risk.tasks.recalculate_risk_task',
        'schedule': RISK_RECALC_MINUTES * 60,
        'kwargs': {'trigger_type': 'SCHEDULED'},
    },
}
