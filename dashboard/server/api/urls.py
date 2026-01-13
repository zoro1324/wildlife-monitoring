"""
URL configuration for the Wildlife Monitoring API.

Organizes endpoints into logical groups:
- /api/auth/ - Authentication
- /api/devices/ - IoT device management
- /api/images/ - Image management
- /api/detections/ - Detection results
- /api/alerts/ - Alert management
- /api/dashboard/ - Dashboard data
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .views import (
    # Auth views
    UserRegistrationView,
    UserProfileView,
    ChangePasswordView,
    LogoutView,
    # Device views
    DeviceViewSet,
    DeviceHeartbeatView,
    # Image views
    ImageViewSet,
    ImageUploadView,
    ManualCaptureView,
    # Detection views
    DetectionViewSet,
    DetectionSummaryView,
    # Alert views
    AlertViewSet,
    # Dashboard views
    DashboardStatsView,
    RecentActivityView,
    DeviceMapDataView,
    DetectionTrendsView,
    LiveFeedView,
)

# Create router for ViewSets
router = DefaultRouter()
router.register(r'devices', DeviceViewSet, basename='device')
router.register(r'images', ImageViewSet, basename='image')
router.register(r'detections', DetectionViewSet, basename='detection')
router.register(r'alerts', AlertViewSet, basename='alert')

# Authentication URLs
auth_patterns = [
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]

# Device-specific URLs (non-ViewSet)
device_patterns = [
    path('heartbeat/', DeviceHeartbeatView.as_view(), name='device_heartbeat'),
]

# Image-specific URLs (non-ViewSet)
image_patterns = [
    path('upload/', ImageUploadView.as_view(), name='image_upload'),
    path('capture/', ManualCaptureView.as_view(), name='manual_capture'),
]

# Detection-specific URLs (non-ViewSet)
detection_patterns = [
    path('summary/', DetectionSummaryView.as_view(), name='detection_summary'),
]

# Dashboard URLs
dashboard_patterns = [
    path('stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
    path('activity/', RecentActivityView.as_view(), name='recent_activity'),
    path('map/', DeviceMapDataView.as_view(), name='device_map'),
    path('trends/', DetectionTrendsView.as_view(), name='detection_trends'),
    path('live/', LiveFeedView.as_view(), name='live_feed'),
]

# Main URL patterns
urlpatterns = [
    # Router URLs (ViewSets)
    path('', include(router.urls)),
    
    # Auth endpoints
    path('auth/', include((auth_patterns, 'auth'))),
    
    # Additional device endpoints
    path('devices/', include((device_patterns, 'device-extra'))),
    
    # Additional image endpoints
    path('images/', include((image_patterns, 'image-extra'))),
    
    # Additional detection endpoints
    path('detections/', include((detection_patterns, 'detection-extra'))),
    
    # Dashboard endpoints
    path('dashboard/', include((dashboard_patterns, 'dashboard'))),
]
