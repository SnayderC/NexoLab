"""Rutas de NexoLab. La API vive en /api/v1/ (sección 13)."""

from django.urls import include, path

urlpatterns = [
    path('api/v1/', include('apps.core.urls')),
    path('api/v1/', include('apps.users.urls')),
    path('api/v1/', include('apps.incidents.urls')),
    path('api/v1/', include('apps.infrastructure.urls')),
    path('api/v1/', include('apps.risk.urls')),
]
