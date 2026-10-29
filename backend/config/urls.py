"""Rutas de NexoLab. La API vive en /api/v1/ (sección 13)."""

from django.urls import include, path

urlpatterns = [
    path('api/v1/', include('apps.users.urls')),
]
