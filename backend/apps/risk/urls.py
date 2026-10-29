from django.urls import path

from . import views

urlpatterns = [
    path('risk/recalculate', views.RecalculateView.as_view(), name='risk-recalculate'),
    path('dashboard/summary', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
]
