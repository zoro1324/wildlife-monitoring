from django.urls import path
from . import views

urlpatterns = [
    # Authentication endpoints
    path("auth/signup/", views.signup, name="signup"),
    path("auth/login/", views.login, name="login"),
    path("auth/logout/", views.logout, name="logout"),
    path("auth/profile/", views.user_profile, name="user_profile"),
    # Device endpoints
    path("device/message/", views.device_message, name="device_message"),
    # Test endpoint
    path("test/", views.test_view, name="test"),
]
