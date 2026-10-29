from django.urls import path

from . import views

urlpatterns = [
    path('catalogs', views.CatalogsView.as_view(), name='catalogs'),
]
