from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class UserProfile(models.Model):
    """
    User profile model to extend the default User model with additional fields.
    """
    USER_TYPE_CHOICES = [
        ('public', 'Public'),
        ('ranger', 'Ranger'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    mobile_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    home_lat = models.FloatField(null=True, blank=True, help_text="Home Latitude")
    home_lon = models.FloatField(null=True, blank=True, help_text="Home Longitude")
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='public')
    
    def __str__(self):
        return f"{self.user.username}'s profile ({self.user_type})"
    
    class Meta:
        verbose_name = "User Profile"
        verbose_name_plural = "User Profiles"


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    """Create a UserProfile whenever a User is created."""
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    """Save the UserProfile whenever the User is saved."""
    if hasattr(instance, 'profile'):
        instance.profile.save()


class Device(models.Model):
    """
    Model to store IoT device information.
    """
    device_id = models.CharField(max_length=100, unique=True)
    lat = models.FloatField(null=True, blank=True, help_text="Latitude")
    lon = models.FloatField(null=True, blank=True, help_text="Longitude")
    owned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="devices")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.device_id
    
    class Meta:
        verbose_name = "Device"
        verbose_name_plural = "Devices"


class DeviceMessage(models.Model):
    """
    Model to store device connection messages/pings from ESP32.
    """
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="messages")
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.device.device_id} - {self.timestamp}"


class CapturedImage(models.Model):
    """
    Model to store images captured by ESP32 devices and their YOLO classifications.
    """
    ANIMAL_CHOICES = [
        ('Bear', 'Bear'),
        ('Bison', 'Bison'),
        ('Elephant', 'Elephant'),
        ('Human', 'Human'),
        ('Leopard', 'Leopard'),
        ('Lion', 'Lion'),
        ('Tiger', 'Tiger'),
        ('Boar', 'Boar'),
        # Legacy spellings (kept for existing records)
        ('Bision', 'Bision'),
        ('Leopord', 'Leopord'),
        ('Wild Boar', 'Wild Boar'),
    ]
    
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name="captured_images")
    image = models.ImageField(upload_to="captured_images/%Y/%m/%d/", help_text="Original captured image")
    annotated_image = models.ImageField(upload_to="annotated_images/%Y/%m/%d/", null=True, blank=True, help_text="YOLO annotated image with bounding boxes")
    animal_type = models.CharField(max_length=20, choices=ANIMAL_CHOICES)
    confidence = models.FloatField(help_text="Confidence score from YOLO model (0-1)")
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Captured Image"
        verbose_name_plural = "Captured Images"
    
    def __str__(self):
        return f"{self.device.device_id} - {self.animal_type} ({self.confidence:.2%})"
