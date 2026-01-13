from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import secrets


class DeviceToken(models.Model):
    """
    Authentication token for IoT devices.
    
    Used to authenticate ESP32-CAM devices when uploading images or sending heartbeats.
    Each device has a unique token that must be included in API requests.
    """
    
    key = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        help_text="Unique authentication token for the device"
    )
    device = models.OneToOneField(
        'IoTDevice',
        on_delete=models.CASCADE,
        related_name='token',
        help_text="IoT device this token belongs to"
    )
    created = models.DateTimeField(
        auto_now_add=True,
        help_text="Token creation timestamp"
    )
    last_used = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last time this token was used for authentication"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this token is active and can be used"
    )
    
    class Meta:
        verbose_name = "Device Token"
        verbose_name_plural = "Device Tokens"
    
    def save(self, *args, **kwargs):
        if not self.key:
            self.key = self.generate_key()
        super().save(*args, **kwargs)
    
    @staticmethod
    def generate_key():
        """Generate a secure random token."""
        return secrets.token_hex(32)
    
    def __str__(self):
        return f"Token for {self.device.device_id}"


class IoTDevice(models.Model):
    """
    Represents an IoT device (ESP32-CAM) deployed in the field.
    
    Each device is owned by a user and captures images for animal detection.
    """
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('offline', 'Offline'),
        ('maintenance', 'Maintenance'),
    ]
    
    device_id = models.CharField(
        max_length=64,
        unique=True,
        help_text="Unique identifier for the IoT device (MAC address or serial number)"
    )
    owner = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name='iot_devices',
        help_text="User who owns this device"
    )
    latitude = models.FloatField(
        validators=[MinValueValidator(-90.0), MaxValueValidator(90.0)],
        help_text="Device latitude coordinate"
    )
    longitude = models.FloatField(
        validators=[MinValueValidator(-180.0), MaxValueValidator(180.0)],
        help_text="Device longitude coordinate"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active',
        db_index=True,
        help_text="Current operational status"
    )
    last_seen = models.DateTimeField(
        auto_now=True,
        help_text="Last timestamp device communicated with server"
    )
    created = models.DateTimeField(
        auto_now_add=True,
        help_text="Device registration timestamp"
    )
    
    class Meta:
        ordering = ['-last_seen']
        indexes = [
            models.Index(fields=['owner', 'status']),
            models.Index(fields=['device_id']),
        ]
        verbose_name = "IoT Device"
        verbose_name_plural = "IoT Devices"
    
    def __str__(self):
        return f"{self.device_id} - {self.get_status_display()}"


class Image(models.Model):
    """
    Stores metadata for images captured by IoT devices.
    
    Actual image files are stored via ImageField.
    Detection summary is pre-computed for efficient querying and dashboard display.
    """
    
    SOURCE_CHOICES = [
        ('motion', 'Motion Detection'),
        ('manual', 'Manual Capture'),
        ('live', 'Live Stream'),
    ]
    
    THREAT_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    device = models.ForeignKey(
        IoTDevice,
        on_delete=models.CASCADE,
        related_name='images',
        help_text="IoT device that captured this image"
    )
    image = models.ImageField(
        upload_to='captures/%Y/%m/%d/',
        help_text="Captured image file"
    )
    captured = models.DateTimeField(
        db_index=True,
        help_text="Timestamp when image was captured"
    )
    source = models.CharField(
        max_length=20,
        choices=SOURCE_CHOICES,
        help_text="How the image was captured"
    )
    processed = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether image has been processed for detections"
    )
    
    # Detection summary fields for efficient querying
    animal_detected = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether any animals were detected in the image"
    )
    primary_animal = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Primary animal type detected (most confident)"
    )
    max_confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Highest confidence score across all detections"
    )
    threat_level = models.CharField(
        max_length=20,
        choices=THREAT_LEVEL_CHOICES,
        default='low',
        db_index=True,
        help_text="Highest threat level from detected animals"
    )
    
    created = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when record was created in database"
    )
    
    class Meta:
        ordering = ['-captured']
        indexes = [
            models.Index(fields=['device', 'captured']),
            models.Index(fields=['processed', 'animal_detected']),
            models.Index(fields=['threat_level', 'created']),
        ]
        verbose_name = "Image"
        verbose_name_plural = "Images"
    
    def __str__(self):
        return f"Image {self.id} - {self.device.device_id} ({self.captured})"


class AnimalDetection(models.Model):
    """
    Stores individual animal detections within an image.
    
    One image can contain multiple detected animals.
    Bounding box coordinates stored as JSON for flexibility and query optimization.
    """
    
    THREAT_LEVEL_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]
    
    image = models.ForeignKey(
        Image,
        on_delete=models.CASCADE,
        related_name='detections',
        help_text="Image containing this detection"
    )
    animal_type = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Type of animal detected"
    )
    confidence = models.FloatField(
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
        help_text="Confidence score (0-1) of the detection"
    )
    bounding_box = models.JSONField(
        help_text="Bounding box as {x_min, y_min, x_max, y_max} normalized coordinates"
    )
    threat_level = models.CharField(
        max_length=20,
        choices=THREAT_LEVEL_CHOICES,
        help_text="Threat level of this animal type"
    )
    detected_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Detection timestamp"
    )
    
    class Meta:
        ordering = ['-confidence']
        indexes = [
            models.Index(fields=['image', 'animal_type']),
            models.Index(fields=['threat_level']),
        ]
        verbose_name = "Animal Detection"
        verbose_name_plural = "Animal Detections"
    
    def __str__(self):
        return f"{self.animal_type} ({self.confidence:.2f}) - Image {self.image.id}"


class Alert(models.Model):
    """
    Alerts generated when threatening animals are detected.
    
    Alerts notify users about potentially dangerous animals on their property.
    """
    
    ALERT_TYPE_CHOICES = [
        ('high_threat', 'High Threat Animal'),
        ('repeated_detection', 'Repeated Detection'),
        ('unusual_activity', 'Unusual Activity'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='alerts',
        help_text="User receiving the alert"
    )
    image = models.ForeignKey(
        Image,
        on_delete=models.CASCADE,
        related_name='alerts',
        help_text="Image that triggered the alert"
    )
    alert_type = models.CharField(
        max_length=50,
        choices=ALERT_TYPE_CHOICES,
        help_text="Type of alert"
    )
    message = models.TextField(
        help_text="Alert message describing the threat"
    )
    read = models.BooleanField(
        default=False,
        db_index=True,
        help_text="Whether the alert has been read by the user"
    )
    created = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Alert creation timestamp"
    )
    
    class Meta:
        ordering = ['-created']
        indexes = [
            models.Index(fields=['user', 'read', 'created']),
            models.Index(fields=['user', 'created']),
        ]
        verbose_name = "Alert"
        verbose_name_plural = "Alerts"
    
    def __str__(self):
        status = "Read" if self.read else "Unread"
        return f"[{status}] {self.get_alert_type_display()} - {self.user.username}"
