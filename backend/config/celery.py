"""
Celery de NexoLab (D-55): procesa el cálculo de K-Means en segundo plano y lo programa cada 15 minutos.

- El worker ejecuta las tareas:  celery -A config worker -l info --concurrency 1
- Beat las programa:             celery -A config beat -l info
Con Docker Compose (perfil "app") los dos arrancan solos, junto con Redis (la cola de tareas).

Sin REDIS_URL (por ejemplo, al correr el backend a mano sin Redis, o en las pruebas) las tareas se ejecutan
en el mismo proceso, como antes: el sistema funciona igual, solo que no en segundo plano.
"""

import os

from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('nexolab')
# Toma de settings.py todo lo que empieza con CELERY_.
app.config_from_object('django.conf:settings', namespace='CELERY')
# Busca tasks.py en cada app (apps/risk/tasks.py).
app.autodiscover_tasks()
