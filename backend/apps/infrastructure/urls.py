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
    path('device-types', views.DeviceTypeListView.as_view(), name='device-type-list'),
    path('device-types/selection', views.DeviceTypeSelectionView.as_view(), name='device-type-selection'),
    path('devices', views.DeviceListView.as_view(), name='device-list'),
    path('devices/<int:pk>', views.DeviceDetailView.as_view(), name='device-detail'),
    path('devices/<str:code>', views.DeviceHistoryView.as_view(), name='device-history'),
    path('devices/<str:code>/incidents', views.DeviceIncidentsView.as_view(), name='device-incidents'),
]
