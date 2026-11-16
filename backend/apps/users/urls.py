from django.urls import path

from . import views

urlpatterns = [
    path('auth/csrf', views.CsrfView.as_view(), name='auth-csrf'),
    path('auth/login', views.LoginView.as_view(), name='auth-login'),
    path('auth/logout', views.LogoutView.as_view(), name='auth-logout'),
    path('auth/me', views.MeView.as_view(), name='auth-me'),
    path('auth/technician-mode', views.TechnicianModeView.as_view(), name='auth-technician-mode'),
    path('auth/change-password', views.ChangePasswordView.as_view(), name='auth-change-password'),
    path('users', views.UserListView.as_view(), name='user-list'),
    path('users/<int:pk>', views.UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/activate', views.UserActivationView.as_view(is_active=True), name='user-activate'),
    path('users/<int:pk>/deactivate', views.UserActivationView.as_view(is_active=False), name='user-deactivate'),
    path('users/<int:pk>/reset-password', views.ResetPasswordView.as_view(), name='user-reset-password'),
]
