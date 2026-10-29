from django.urls import path

from . import views

urlpatterns = [
    path('incidents', views.IncidentListView.as_view(), name='incident-list'),
    path('incidents/<str:number>', views.IncidentDetailView.as_view(), name='incident-detail'),
    path('incidents/<str:number>/close', views.IncidentCloseView.as_view(), name='incident-close'),
    path('incidents/<str:number>/void', views.IncidentVoidView.as_view(), name='incident-void'),
    # Antes de devices/<code> (apps.infrastructure) para que "eligible" no se tome como un código.
    path('devices/eligible', views.EligibleDeviceListView.as_view(), name='device-eligible'),
]
