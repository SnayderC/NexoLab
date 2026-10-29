from django.urls import path

from . import views

urlpatterns = [
    path('risk/recalculate', views.RecalculateView.as_view(), name='risk-recalculate'),
]
