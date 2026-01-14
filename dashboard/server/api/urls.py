from django.urls import path
from .views import (
    SignupView,
    LoginView,
    LogoutView,
    UserProfileView,
    DeviceListView,
    DeviceRegisterView,
    DeviceDetailView,
    DeviceMessageView,
    CapturedImageView,
    CapturedImageListView,
    TestView,
)

urlpatterns = [
    # Authentication endpoints
    path("auth/signup/", SignupView.as_view(), name="signup"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/profile/", UserProfileView.as_view(), name="user_profile"),
    
    # Device management endpoints
    path("device/", DeviceListView.as_view(), name="device_list"),
    path("device/register/", DeviceRegisterView.as_view(), name="device_register"),
    path("device/message/", DeviceMessageView.as_view(), name="device_message"),
    path("device/capture/", CapturedImageView.as_view(), name="capture_image"),
    path("device/<str:device_id>/", DeviceDetailView.as_view(), name="device_detail"),
    
    # Captured images endpoints
    path("images/", CapturedImageListView.as_view(), name="captured_images"),
    
    # Test endpoint
    path("test/", TestView.as_view(), name="test"),
]
