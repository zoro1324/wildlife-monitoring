"""
Serializers for the Wildlife Monitoring API.

Handles serialization/deserialization of models for API endpoints.
"""

from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.utils import timezone
from .models import IoTDevice, DeviceToken, Image, AnimalDetection, Alert


# =============================================================================
# User & Authentication Serializers
# =============================================================================

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model (read-only display)."""
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined']
        read_only_fields = fields


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration."""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': "Passwords don't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""
    
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, validators=[validate_password])
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


# =============================================================================
# Device Serializers
# =============================================================================

class DeviceTokenSerializer(serializers.ModelSerializer):
    """Serializer for DeviceToken model."""
    
    class Meta:
        model = DeviceToken
        fields = ['key', 'created', 'last_used', 'is_active']
        read_only_fields = ['key', 'created', 'last_used']


class IoTDeviceSerializer(serializers.ModelSerializer):
    """Serializer for IoTDevice model."""
    
    owner = UserSerializer(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    image_count = serializers.SerializerMethodField()
    
    class Meta:
        model = IoTDevice
        fields = [
            'id', 'device_id', 'owner', 'latitude', 'longitude',
            'status', 'status_display', 'last_seen', 'created', 'image_count'
        ]
        read_only_fields = ['id', 'owner', 'last_seen', 'created']
    
    def get_image_count(self, obj):
        return obj.images.count()


class IoTDeviceCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new IoT devices."""
    
    class Meta:
        model = IoTDevice
        fields = ['device_id', 'latitude', 'longitude', 'status']
    
    def validate_device_id(self, value):
        if IoTDevice.objects.filter(device_id=value).exists():
            raise serializers.ValidationError("A device with this ID already exists.")
        return value
    
    def create(self, validated_data):
        validated_data['owner'] = self.context['request'].user
        device = IoTDevice.objects.create(**validated_data)
        # Auto-create device token
        DeviceToken.objects.create(device=device)
        return device


class DeviceHeartbeatSerializer(serializers.Serializer):
    """Serializer for device heartbeat data."""
    
    battery_level = serializers.IntegerField(min_value=0, max_value=100, required=False)
    signal_strength = serializers.IntegerField(min_value=-100, max_value=0, required=False)
    temperature = serializers.FloatField(required=False)
    
    def update_device(self, device):
        """Update device last_seen timestamp."""
        device.status = 'active'
        device.save(update_fields=['status', 'last_seen'])
        return device


class DeviceRegistrationResponseSerializer(serializers.ModelSerializer):
    """Serializer for device registration response including token."""
    
    token = serializers.SerializerMethodField()
    
    class Meta:
        model = IoTDevice
        fields = ['id', 'device_id', 'latitude', 'longitude', 'status', 'token']
    
    def get_token(self, obj):
        if hasattr(obj, 'token'):
            return obj.token.key
        return None


# =============================================================================
# Image Serializers
# =============================================================================

class ImageListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for image lists."""
    
    device_id = serializers.CharField(source='device.device_id', read_only=True)
    detection_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Image
        fields = [
            'id', 'device_id', 'image', 'captured', 'source', 'processed',
            'animal_detected', 'primary_animal', 'max_confidence', 'threat_level',
            'detection_count'
        ]
    
    def get_detection_count(self, obj):
        return obj.detections.count()


class ImageDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single image view."""
    
    device = IoTDeviceSerializer(read_only=True)
    detections = serializers.SerializerMethodField()
    
    class Meta:
        model = Image
        fields = [
            'id', 'device', 'image', 'captured', 'source', 'processed',
            'animal_detected', 'primary_animal', 'max_confidence', 'threat_level',
            'created', 'detections'
        ]
    
    def get_detections(self, obj):
        return AnimalDetectionSerializer(obj.detections.all(), many=True).data


class ImageUploadSerializer(serializers.ModelSerializer):
    """Serializer for image uploads from IoT devices."""
    
    device_id = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Image
        fields = ['device_id', 'image', 'source', 'captured']
        extra_kwargs = {
            'captured': {'required': False}
        }
    
    def validate(self, attrs):
        # Set captured timestamp if not provided
        if 'captured' not in attrs or attrs['captured'] is None:
            attrs['captured'] = timezone.now()
        return attrs
    
    def create(self, validated_data):
        # Remove device_id from validated_data as it's handled separately
        validated_data.pop('device_id', None)
        
        # Device is set from authentication context
        request = self.context.get('request')
        from .models import IoTDevice
        
        if isinstance(request.user, IoTDevice):
            validated_data['device'] = request.user
        else:
            raise serializers.ValidationError("Image upload requires device authentication.")
        
        return Image.objects.create(**validated_data)


# =============================================================================
# Detection Serializers
# =============================================================================

class AnimalDetectionSerializer(serializers.ModelSerializer):
    """Serializer for AnimalDetection model."""
    
    threat_level_display = serializers.CharField(source='get_threat_level_display', read_only=True)
    
    class Meta:
        model = AnimalDetection
        fields = [
            'id', 'animal_type', 'confidence', 'bounding_box',
            'threat_level', 'threat_level_display', 'detected_at'
        ]
        read_only_fields = fields


class AnimalDetectionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating detections (internal use by AI service)."""
    
    class Meta:
        model = AnimalDetection
        fields = ['image', 'animal_type', 'confidence', 'bounding_box', 'threat_level']


class DetectionResultSerializer(serializers.Serializer):
    """Serializer for AI detection results."""
    
    animal_type = serializers.CharField()
    confidence = serializers.FloatField(min_value=0, max_value=1)
    bounding_box = serializers.DictField(child=serializers.FloatField())
    threat_level = serializers.ChoiceField(choices=['low', 'medium', 'high'])


class BulkDetectionSerializer(serializers.Serializer):
    """Serializer for bulk detection results from AI service."""
    
    image_id = serializers.IntegerField()
    detections = DetectionResultSerializer(many=True)


# =============================================================================
# Alert Serializers
# =============================================================================

class AlertSerializer(serializers.ModelSerializer):
    """Serializer for Alert model."""
    
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    image_url = serializers.SerializerMethodField()
    device_id = serializers.CharField(source='image.device.device_id', read_only=True)
    
    class Meta:
        model = Alert
        fields = [
            'id', 'alert_type', 'alert_type_display', 'message',
            'read', 'created', 'image_url', 'device_id'
        ]
        read_only_fields = ['id', 'alert_type', 'message', 'created', 'image_url', 'device_id']
    
    def get_image_url(self, obj):
        if obj.image and obj.image.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.image.url)
        return None


class AlertDetailSerializer(AlertSerializer):
    """Detailed serializer for single alert view."""
    
    image = ImageDetailSerializer(read_only=True)
    
    class Meta(AlertSerializer.Meta):
        fields = AlertSerializer.Meta.fields + ['image']


class MarkAlertReadSerializer(serializers.Serializer):
    """Serializer for marking alerts as read."""
    
    alert_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="List of alert IDs to mark as read. If empty, marks all alerts as read."
    )


# =============================================================================
# Dashboard Serializers
# =============================================================================

class DashboardStatsSerializer(serializers.Serializer):
    """Serializer for dashboard statistics."""
    
    total_devices = serializers.IntegerField()
    active_devices = serializers.IntegerField()
    offline_devices = serializers.IntegerField()
    total_images = serializers.IntegerField()
    images_today = serializers.IntegerField()
    total_detections = serializers.IntegerField()
    detections_today = serializers.IntegerField()
    unread_alerts = serializers.IntegerField()
    high_threat_alerts = serializers.IntegerField()


class RecentActivitySerializer(serializers.Serializer):
    """Serializer for recent activity feed."""
    
    activity_type = serializers.CharField()
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()
    device_id = serializers.CharField(required=False)
    image_id = serializers.IntegerField(required=False)
    threat_level = serializers.CharField(required=False)


class DetectionSummarySerializer(serializers.Serializer):
    """Serializer for detection summary by animal type."""
    
    animal_type = serializers.CharField()
    count = serializers.IntegerField()
    avg_confidence = serializers.FloatField()
    last_detected = serializers.DateTimeField()


class DeviceStatusSummarySerializer(serializers.Serializer):
    """Serializer for device status summary."""
    
    device_id = serializers.CharField()
    status = serializers.CharField()
    last_seen = serializers.DateTimeField()
    images_count = serializers.IntegerField()
    alerts_count = serializers.IntegerField()
