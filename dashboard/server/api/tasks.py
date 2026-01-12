"""
Celery tasks for the Wildlife Monitoring System.

Handles background processing:
- AI image detection
- Alert generation
- Device status monitoring
- Cleanup tasks
"""

from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_image_detection(self, image_id):
    """
    Process an image through the AI detection model.
    
    This task is queued when a new image is uploaded by an IoT device.
    It runs YOLO detection and updates the database with results.
    """
    from .models import Image, AnimalDetection
    from .services import AIDetectionService
    
    try:
        image = Image.objects.select_related('device').get(id=image_id)
        
        if image.processed:
            logger.info(f"Image {image_id} already processed, skipping")
            return {'status': 'skipped', 'reason': 'already_processed'}
        
        logger.info(f"Processing image {image_id} from device {image.device.device_id}")
        
        # Initialize AI service
        ai_service = AIDetectionService()
        
        # Run detection
        detections = ai_service.detect(image.image.path)
        
        # Process results
        if detections:
            highest_confidence = 0
            highest_threat = 'low'
            primary_animal = ''
            
            for detection in detections:
                # Create detection record
                AnimalDetection.objects.create(
                    image=image,
                    animal_type=detection['animal_type'],
                    confidence=detection['confidence'],
                    bounding_box=detection['bounding_box'],
                    threat_level=detection['threat_level'],
                )
                
                # Track highest confidence detection
                if detection['confidence'] > highest_confidence:
                    highest_confidence = detection['confidence']
                    primary_animal = detection['animal_type']
                
                # Track highest threat level
                threat_order = {'low': 0, 'medium': 1, 'high': 2}
                if threat_order.get(detection['threat_level'], 0) > threat_order.get(highest_threat, 0):
                    highest_threat = detection['threat_level']
            
            # Update image summary fields
            image.animal_detected = True
            image.primary_animal = primary_animal
            image.max_confidence = highest_confidence
            image.threat_level = highest_threat
            
            # Generate alert if high threat
            if highest_threat == 'high':
                generate_alert.delay(image_id)
        
        image.processed = True
        image.save()
        
        logger.info(f"Image {image_id} processed successfully. Detections: {len(detections)}")
        
        return {
            'status': 'success',
            'image_id': image_id,
            'detections': len(detections),
            'threat_level': image.threat_level
        }
        
    except Image.DoesNotExist:
        logger.error(f"Image {image_id} not found")
        return {'status': 'error', 'reason': 'image_not_found'}
    
    except Exception as exc:
        logger.exception(f"Error processing image {image_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task
def generate_alert(image_id):
    """
    Generate an alert for a high-threat detection.
    
    Creates an Alert record and can trigger notifications.
    """
    from .models import Image, Alert
    
    try:
        image = Image.objects.select_related('device', 'device__owner').get(id=image_id)
        
        # Check if alert already exists for this image
        if Alert.objects.filter(image=image, alert_type='high_threat').exists():
            logger.info(f"Alert already exists for image {image_id}")
            return {'status': 'skipped', 'reason': 'alert_exists'}
        
        # Create alert
        alert = Alert.objects.create(
            user=image.device.owner,
            image=image,
            alert_type='high_threat',
            message=f"⚠️ High threat detected: {image.primary_animal} detected near device {image.device.device_id} with {image.max_confidence:.0%} confidence.",
        )
        
        logger.info(f"Alert {alert.id} created for image {image_id}")
        
        # Trigger notification (can be extended for SMS, email, push)
        send_notification.delay(alert.id)
        
        return {
            'status': 'success',
            'alert_id': alert.id
        }
        
    except Image.DoesNotExist:
        logger.error(f"Image {image_id} not found for alert generation")
        return {'status': 'error', 'reason': 'image_not_found'}
    
    except Exception as exc:
        logger.exception(f"Error generating alert for image {image_id}: {exc}")
        return {'status': 'error', 'reason': str(exc)}


@shared_task
def send_notification(alert_id):
    """
    Send notification for an alert.
    
    Currently logs the notification. Can be extended for:
    - Push notifications
    - SMS via Twilio
    - Email
    - WebSocket notifications
    """
    from .models import Alert
    
    try:
        alert = Alert.objects.select_related('user', 'image').get(id=alert_id)
        
        # Log notification (placeholder for actual notification service)
        logger.info(
            f"NOTIFICATION - User: {alert.user.username}, "
            f"Type: {alert.alert_type}, "
            f"Message: {alert.message}"
        )
        
        # TODO: Implement actual notification channels
        # - Firebase Cloud Messaging for push notifications
        # - Twilio for SMS
        # - Django email for email notifications
        
        return {
            'status': 'success',
            'alert_id': alert_id,
            'user': alert.user.username
        }
        
    except Alert.DoesNotExist:
        logger.error(f"Alert {alert_id} not found")
        return {'status': 'error', 'reason': 'alert_not_found'}


@shared_task
def check_device_status():
    """
    Periodic task to check device health and mark offline devices.
    
    Should be scheduled to run every 5-10 minutes.
    """
    from .models import IoTDevice
    
    # Consider device offline if not seen for 15 minutes
    offline_threshold = timezone.now() - timedelta(minutes=15)
    
    # Find active devices that haven't been seen recently
    stale_devices = IoTDevice.objects.filter(
        status='active',
        last_seen__lt=offline_threshold
    )
    
    count = stale_devices.count()
    
    if count > 0:
        stale_devices.update(status='offline')
        logger.warning(f"Marked {count} devices as offline due to inactivity")
    
    return {
        'status': 'success',
        'devices_marked_offline': count
    }


@shared_task
def cleanup_old_images(days=90):
    """
    Periodic task to clean up old processed images.
    
    Removes images older than specified days that have been processed
    and don't have high-threat detections.
    """
    from .models import Image
    import os
    
    cutoff_date = timezone.now() - timedelta(days=days)
    
    # Find old, processed, low-threat images
    old_images = Image.objects.filter(
        created__lt=cutoff_date,
        processed=True,
        threat_level='low'
    )
    
    count = 0
    for image in old_images:
        # Delete the actual image file
        if image.image:
            try:
                if os.path.exists(image.image.path):
                    os.remove(image.image.path)
            except Exception as e:
                logger.error(f"Error deleting image file: {e}")
        
        image.delete()
        count += 1
    
    logger.info(f"Cleaned up {count} old images")
    
    return {
        'status': 'success',
        'images_deleted': count
    }


@shared_task
def process_pending_images():
    """
    Periodic task to reprocess any images that failed initial processing.
    
    Useful for recovering from temporary AI service outages.
    """
    from .models import Image
    
    # Find unprocessed images older than 5 minutes (stuck in queue)
    stuck_threshold = timezone.now() - timedelta(minutes=5)
    
    pending_images = Image.objects.filter(
        processed=False,
        created__lt=stuck_threshold
    ).values_list('id', flat=True)[:50]  # Limit batch size
    
    count = 0
    for image_id in pending_images:
        process_image_detection.delay(image_id)
        count += 1
    
    if count > 0:
        logger.info(f"Requeued {count} pending images for processing")
    
    return {
        'status': 'success',
        'images_requeued': count
    }


@shared_task
def generate_daily_report():
    """
    Generate daily summary report for each user.
    
    Can be extended to send email reports.
    """
    from django.contrib.auth.models import User
    from .models import IoTDevice, Image, AnimalDetection, Alert
    
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    reports = []
    
    for user in User.objects.filter(is_active=True):
        devices = IoTDevice.objects.filter(owner=user)
        
        if not devices.exists():
            continue
        
        # Calculate daily stats
        images_count = Image.objects.filter(
            device__owner=user,
            captured__date=yesterday
        ).count()
        
        detections_count = AnimalDetection.objects.filter(
            image__device__owner=user,
            detected_at__date=yesterday
        ).count()
        
        high_threats = Image.objects.filter(
            device__owner=user,
            captured__date=yesterday,
            threat_level='high'
        ).count()
        
        report = {
            'user': user.username,
            'date': str(yesterday),
            'devices': devices.count(),
            'images': images_count,
            'detections': detections_count,
            'high_threats': high_threats,
        }
        
        reports.append(report)
        logger.info(f"Daily report for {user.username}: {report}")
    
    return {
        'status': 'success',
        'reports_generated': len(reports)
    }
