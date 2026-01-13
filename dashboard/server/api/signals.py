"""
Django signals for the Wildlife Monitoring API.

Handles automatic actions triggered by model events:
- Device status updates
- Alert generation
- Notification triggers
"""

from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.utils import timezone
import logging

from .models import IoTDevice, DeviceToken, Image, AnimalDetection, Alert

logger = logging.getLogger(__name__)


@receiver(post_save, sender=IoTDevice)
def create_device_token(sender, instance, created, **kwargs):
    """
    Automatically create a DeviceToken when a new IoTDevice is created.
    """
    if created:
        if not hasattr(instance, 'token'):
            DeviceToken.objects.create(device=instance)
            logger.info(f"Auto-created token for device: {instance.device_id}")


@receiver(post_save, sender=AnimalDetection)
def check_for_alert_trigger(sender, instance, created, **kwargs):
    """
    Check if a new detection should trigger an alert.
    
    This provides an alternative to the Celery task approach for simpler setups.
    """
    if created and instance.threat_level == 'high':
        image = instance.image
        
        # Check if alert already exists
        if not Alert.objects.filter(image=image, alert_type='high_threat').exists():
            # Create alert
            Alert.objects.create(
                user=image.device.owner,
                image=image,
                alert_type='high_threat',
                message=f"⚠️ High threat: {instance.animal_type} detected near device {image.device.device_id} with {instance.confidence:.0%} confidence.",
            )
            logger.info(f"Alert created for high-threat detection: {instance.animal_type}")


@receiver(post_save, sender=Alert)
def log_new_alert(sender, instance, created, **kwargs):
    """
    Log new alerts for monitoring.
    """
    if created:
        logger.warning(
            f"NEW ALERT - User: {instance.user.username}, "
            f"Type: {instance.alert_type}, "
            f"Device: {instance.image.device.device_id if instance.image else 'N/A'}"
        )


@receiver(pre_delete, sender=IoTDevice)
def cleanup_device_images(sender, instance, **kwargs):
    """
    Log device deletion for audit purposes.
    
    Note: Images are automatically deleted due to CASCADE.
    """
    image_count = instance.images.count()
    logger.warning(
        f"Deleting device {instance.device_id} with {image_count} images. "
        f"Owner: {instance.owner.username}"
    )


@receiver(post_save, sender=Image)
def update_device_activity(sender, instance, created, **kwargs):
    """
    Update device last_seen when a new image is captured.
    """
    if created:
        device = instance.device
        device.status = 'active'
        device.save(update_fields=['status', 'last_seen'])
