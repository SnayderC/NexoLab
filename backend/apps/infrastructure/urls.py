from django.urls import path

from . import views

urlpatterns = [
    path('laboratories', views.LaboratoryListView.as_view(), name='laboratory-list'),
    path('laboratories/<int:pk>', views.LaboratoryDetailView.as_view(), name='laboratory-detail'),
    path(
        'laboratories/<int:pk>/activate',
        views.LaboratoryActivationView.as_view(is_active=True),
        name='laboratory-activate',
    ),
    path(
        'laboratories/<int:pk>/deactivate',
        views.LaboratoryActivationView.as_view(is_active=False),
        name='laboratory-deactivate',
    ),
]
