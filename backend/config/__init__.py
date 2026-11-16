# Carga Celery junto con Django, para que las tareas (@shared_task) usen esta configuración (D-55).
from .celery import app as celery_app

__all__ = ('celery_app',)
