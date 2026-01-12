"""
API Views for the Wildlife Monitoring System.

Provides REST endpoints for:
- User authentication
- IoT device management
- Image uploads and retrieval
- Detection results
- Alert management
- Dashboard data
"""

from rest_framework import viewsets, status, generics, views
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Count, Avg, Q
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
import logging

from .models import IoTDevice, DeviceToken, Image, AnimalDetection, Alert
from .serializers import (
    UserSerializer, UserRegistrationSerializer, ChangePasswordSerializer,
    IoTDeviceSerializer, IoTDeviceCreateSerializer, DeviceRegistrationResponseSerializer,
    DeviceHeartbeatSerializer, DeviceTokenSerializer,
    ImageListSerializer, ImageDetailSerializer, ImageUploadSerializer,
    AnimalDetectionSerializer,
    AlertSerializer, AlertDetailSerializer, MarkAlertReadSerializer,
    DashboardStatsSerializer, RecentActivitySerializer, DetectionSummarySerializer,
)
from .permissions import (
    IsDeviceOwner, IsDeviceAuthenticated, IsDeviceOrOwner, CanManageAlerts
)

logger = logging.getLogger(__name__)


# =============================================================================
# Authentication Views
# =============================================================================

class UserRegistrationView(generics.CreateAPIView):
    """
    Register a new user account.
    
    POST /api/auth/register/
    """
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'message': 'User registered successfully',
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }
        }, status=status.HTTP_201_CREATED)


class UserProfileView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's profile.
    
    GET /api/auth/profile/
    PATCH /api/auth/profile/
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.UpdateAPIView):
    """
    Change the authenticated user's password.
    
    POST /api/auth/change-password/
    """
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })


class LogoutView(views.APIView):
    """
    Logout user by blacklisting their refresh token.
    
    POST /api/auth/logout/
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'success': True,
                'message': 'Logged out successfully'
            })
        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# Device Views
# =============================================================================

class DeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for IoT device management.
    
    Endpoints:
    - GET /api/devices/ - List user's devices
    - POST /api/devices/ - Register new device
    - GET /api/devices/{id}/ - Device details
    - PATCH /api/devices/{id}/ - Update device
    - DELETE /api/devices/{id}/ - Delete device
    - POST /api/devices/{id}/regenerate-token/ - Regenerate device token
    """
    permission_classes = [IsAuthenticated, IsDeviceOwner]
    
    def get_queryset(self):
        return IoTDevice.objects.filter(owner=self.request.user).select_related('owner')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return IoTDeviceCreateSerializer
        return IoTDeviceSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = serializer.save()
        
        return Response({
            'success': True,
            'message': 'Device registered successfully',
            'data': DeviceRegistrationResponseSerializer(device).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def regenerate_token(self, request, pk=None):
        """Regenerate device authentication token."""
        device = self.get_object()
        
        # Delete existing token if exists
        DeviceToken.objects.filter(device=device).delete()
        
        # Create new token
        new_token = DeviceToken.objects.create(device=device)
        
        return Response({
            'success': True,
            'message': 'Token regenerated successfully',
            'data': {
                'token': new_token.key
            }
        })
    
    @action(detail=True, methods=['get'])
    def token(self, request, pk=None):
        """Get device token."""
        device = self.get_object()
        
        try:
            token = device.token
            return Response({
                'success': True,
                'data': DeviceTokenSerializer(token).data
            })
        except DeviceToken.DoesNotExist:
            return Response({
                'success': False,
                'error': 'No token found for this device'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def images(self, request, pk=None):
        """Get images captured by this device."""
        device = self.get_object()
        images = device.images.all()[:50]  # Limit to recent 50
        
        return Response({
            'success': True,
            'data': ImageListSerializer(images, many=True, context={'request': request}).data
        })


class DeviceHeartbeatView(views.APIView):
    """
    Endpoint for device heartbeat signals.
    
    POST /api/devices/heartbeat/
    
    Used by ESP32-CAM to report health status and maintain active connection.
    """
    permission_classes = [IsDeviceAuthenticated]
    
    def post(self, request):
        serializer = DeviceHeartbeatSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # request.user is the IoTDevice when using DeviceTokenAuthentication
        device = request.user
        serializer.update_device(device)
        
        logger.info(f"Heartbeat received from device: {device.device_id}")
        
        return Response({
            'success': True,
            'message': 'Heartbeat received',
            'data': {
                'device_id': device.device_id,
                'status': device.status,
                'server_time': timezone.now().isoformat()
            }
        })


# =============================================================================
# Image Views
# =============================================================================

class ImageViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for image retrieval.
    
    GET /api/images/ - List images
    GET /api/images/{id}/ - Image details with detections
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Image.objects.filter(
            device__owner=self.request.user
        ).select_related('device').prefetch_related('detections')
        
        # Filter by device
        device_id = self.request.query_params.get('device')
        if device_id:
            queryset = queryset.filter(device__device_id=device_id)
        
        # Filter by processed status
        processed = self.request.query_params.get('processed')
        if processed is not None:
            queryset = queryset.filter(processed=processed.lower() == 'true')
        
        # Filter by threat level
        threat_level = self.request.query_params.get('threat_level')
        if threat_level:
            queryset = queryset.filter(threat_level=threat_level)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(captured__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(captured__date__lte=end_date)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ImageDetailSerializer
        return ImageListSerializer


class ImageUploadView(generics.CreateAPIView):
    """
    Endpoint for image uploads from IoT devices.
    
    POST /api/images/upload/
    
    Requires device token authentication.
    Automatically queues image for AI processing.
    """
    serializer_class = ImageUploadSerializer
    permission_classes = [IsDeviceAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        
        logger.info(f"Image uploaded from device: {request.user.device_id}, image_id: {image.id}")
        
        # Queue for AI processing
        from .tasks import process_image_detection
        process_image_detection.delay(image.id)
        
        return Response({
            'success': True,
            'message': 'Image uploaded successfully and queued for processing',
            'data': {
                'image_id': image.id,
                'status': 'processing'
            }
        }, status=status.HTTP_201_CREATED)


class ManualCaptureView(views.APIView):
    """
    Request a manual capture from a specific device.
    
    POST /api/images/capture/
    
    This endpoint can be used by farmers to request an immediate snapshot.
    """
    permission_classes = [IsAuthenticated, IsDeviceOwner]
    
    def post(self, request):
        device_id = request.data.get('device_id')
        
        try:
            device = IoTDevice.objects.get(device_id=device_id, owner=request.user)
        except IoTDevice.DoesNotExist:
            return Response({
                'success': False,
                'error': 'Device not found'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if device.status != 'active':
            return Response({
                'success': False,
                'error': f'Device is {device.status}. Cannot request capture.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # In production, this would send a command to the device
        # For now, we just acknowledge the request
        return Response({
            'success': True,
            'message': 'Capture request sent to device',
            'data': {
                'device_id': device.device_id,
                'request_time': timezone.now().isoformat()
            }
        })


# =============================================================================
# Detection Views
# =============================================================================

class DetectionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for animal detection results.
    
    GET /api/detections/ - List detections
    GET /api/detections/{id}/ - Detection details
    """
    serializer_class = AnimalDetectionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = AnimalDetection.objects.filter(
            image__device__owner=self.request.user
        ).select_related('image', 'image__device')
        
        # Filter by animal type
        animal_type = self.request.query_params.get('animal_type')
        if animal_type:
            queryset = queryset.filter(animal_type__icontains=animal_type)
        
        # Filter by threat level
        threat_level = self.request.query_params.get('threat_level')
        if threat_level:
            queryset = queryset.filter(threat_level=threat_level)
        
        # Filter by confidence threshold
        min_confidence = self.request.query_params.get('min_confidence')
        if min_confidence:
            queryset = queryset.filter(confidence__gte=float(min_confidence))
        
        return queryset


class DetectionSummaryView(views.APIView):
    """
    Get detection statistics grouped by animal type.
    
    GET /api/detections/summary/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timedelta(days=days)
        
        summary = AnimalDetection.objects.filter(
            image__device__owner=request.user,
            detected_at__gte=since
        ).values('animal_type').annotate(
            count=Count('id'),
            avg_confidence=Avg('confidence')
        ).order_by('-count')
        
        return Response({
            'success': True,
            'data': list(summary)
        })


# =============================================================================
# Alert Views
# =============================================================================

class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet for alert management.
    
    GET /api/alerts/ - List user's alerts
    GET /api/alerts/{id}/ - Alert details
    PATCH /api/alerts/{id}/ - Update alert (mark as read)
    DELETE /api/alerts/{id}/ - Delete alert
    """
    permission_classes = [IsAuthenticated, CanManageAlerts]
    
    def get_queryset(self):
        queryset = Alert.objects.filter(
            user=self.request.user
        ).select_related('image', 'image__device')
        
        # Filter by read status
        read = self.request.query_params.get('read')
        if read is not None:
            queryset = queryset.filter(read=read.lower() == 'true')
        
        # Filter by alert type
        alert_type = self.request.query_params.get('alert_type')
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AlertDetailSerializer
        return AlertSerializer
    
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        """Mark one or more alerts as read."""
        serializer = MarkAlertReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        alert_ids = serializer.validated_data.get('alert_ids', [])
        
        queryset = Alert.objects.filter(user=request.user, read=False)
        if alert_ids:
            queryset = queryset.filter(id__in=alert_ids)
        
        updated = queryset.update(read=True)
        
        return Response({
            'success': True,
            'message': f'{updated} alerts marked as read'
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread alerts."""
        count = Alert.objects.filter(user=request.user, read=False).count()
        
        return Response({
            'success': True,
            'data': {
                'unread_count': count
            }
        })


# =============================================================================
# Dashboard Views
# =============================================================================

class DashboardStatsView(views.APIView):
    """
    Get dashboard statistics for the authenticated user.
    
    GET /api/dashboard/stats/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        today = timezone.now().date()
        
        # Device stats
        devices = IoTDevice.objects.filter(owner=user)
        total_devices = devices.count()
        active_devices = devices.filter(status='active').count()
        offline_devices = devices.filter(status='offline').count()
        
        # Image stats
        images = Image.objects.filter(device__owner=user)
        total_images = images.count()
        images_today = images.filter(captured__date=today).count()
        
        # Detection stats
        detections = AnimalDetection.objects.filter(image__device__owner=user)
        total_detections = detections.count()
        detections_today = detections.filter(detected_at__date=today).count()
        
        # Alert stats
        alerts = Alert.objects.filter(user=user)
        unread_alerts = alerts.filter(read=False).count()
        high_threat_alerts = alerts.filter(
            image__threat_level='high',
            read=False
        ).count()
        
        data = {
            'total_devices': total_devices,
            'active_devices': active_devices,
            'offline_devices': offline_devices,
            'total_images': total_images,
            'images_today': images_today,
            'total_detections': total_detections,
            'detections_today': detections_today,
            'unread_alerts': unread_alerts,
            'high_threat_alerts': high_threat_alerts,
        }
        
        serializer = DashboardStatsSerializer(data)
        
        return Response({
            'success': True,
            'data': serializer.data
        })


class RecentActivityView(views.APIView):
    """
    Get recent activity feed for the dashboard.
    
    GET /api/dashboard/activity/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        limit = int(request.query_params.get('limit', 20))
        
        activities = []
        
        # Recent detections
        recent_detections = AnimalDetection.objects.filter(
            image__device__owner=user
        ).select_related('image', 'image__device').order_by('-detected_at')[:limit]
        
        for detection in recent_detections:
            activities.append({
                'activity_type': 'detection',
                'message': f'{detection.animal_type} detected with {detection.confidence:.0%} confidence',
                'timestamp': detection.detected_at,
                'device_id': detection.image.device.device_id,
                'image_id': detection.image.id,
                'threat_level': detection.threat_level,
            })
        
        # Recent alerts
        recent_alerts = Alert.objects.filter(user=user).order_by('-created')[:limit]
        
        for alert in recent_alerts:
            activities.append({
                'activity_type': 'alert',
                'message': alert.message,
                'timestamp': alert.created,
                'device_id': alert.image.device.device_id if alert.image else None,
                'image_id': alert.image.id if alert.image else None,
                'threat_level': alert.image.threat_level if alert.image else None,
            })
        
        # Sort by timestamp
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'success': True,
            'data': activities[:limit]
        })


class DeviceMapDataView(views.APIView):
    """
    Get device locations for map display.
    
    GET /api/dashboard/map/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        devices = IoTDevice.objects.filter(owner=request.user).annotate(
            detection_count=Count('images__detections'),
            alert_count=Count('images__alerts')
        )
        
        data = []
        for device in devices:
            data.append({
                'device_id': device.device_id,
                'latitude': device.latitude,
                'longitude': device.longitude,
                'status': device.status,
                'last_seen': device.last_seen,
                'detection_count': device.detection_count,
                'alert_count': device.alert_count,
            })
        
        return Response({
            'success': True,
            'data': data
        })


class DetectionTrendsView(views.APIView):
    """
    Get detection trends over time for charts.
    
    GET /api/dashboard/trends/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        days = int(request.query_params.get('days', 7))
        since = timezone.now() - timedelta(days=days)
        
        # Daily detection counts
        daily_counts = AnimalDetection.objects.filter(
            image__device__owner=request.user,
            detected_at__gte=since
        ).annotate(
            date=TruncDate('detected_at')
        ).values('date').annotate(
            count=Count('id')
        ).order_by('date')
        
        # Detection by animal type
        by_animal = AnimalDetection.objects.filter(
            image__device__owner=request.user,
            detected_at__gte=since
        ).values('animal_type').annotate(
            count=Count('id')
        ).order_by('-count')
        
        # Detection by threat level
        by_threat = AnimalDetection.objects.filter(
            image__device__owner=request.user,
            detected_at__gte=since
        ).values('threat_level').annotate(
            count=Count('id')
        ).order_by('threat_level')
        
        return Response({
            'success': True,
            'data': {
                'daily_counts': list(daily_counts),
                'by_animal': list(by_animal),
                'by_threat': list(by_threat),
            }
        })


class LiveFeedView(views.APIView):
    """
    Get recent images for live feed display.
    
    GET /api/dashboard/live/
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        device_id = request.query_params.get('device')
        limit = int(request.query_params.get('limit', 10))
        
        queryset = Image.objects.filter(
            device__owner=request.user
        ).select_related('device').order_by('-captured')
        
        if device_id:
            queryset = queryset.filter(device__device_id=device_id)
        
        images = queryset[:limit]
        
        return Response({
            'success': True,
            'data': ImageListSerializer(images, many=True, context={'request': request}).data
        })

