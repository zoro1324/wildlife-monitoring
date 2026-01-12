"""
Celery configuration for the Wildlife Monitoring System.

This file configures Celery for background task processing.
"""

import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')

# Create Celery app
app = Celery('server')

# Load config from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


# =============================================================================
# Celery Beat Schedule (Periodic Tasks)
# =============================================================================

app.conf.beat_schedule = {
    # Check device status every 5 minutes
    'check-device-status': {
        'task': 'api.tasks.check_device_status',
        'schedule': crontab(minute='*/5'),
    },
    
    # Process pending images every 10 minutes
    'process-pending-images': {
        'task': 'api.tasks.process_pending_images',
        'schedule': crontab(minute='*/10'),
    },
    
    # Generate daily reports at 6 AM
    'daily-report': {
        'task': 'api.tasks.generate_daily_report',
        'schedule': crontab(hour=6, minute=0),
    },
    
    # Cleanup old images weekly (Sunday at 3 AM)
    'cleanup-old-images': {
        'task': 'api.tasks.cleanup_old_images',
        'schedule': crontab(hour=3, minute=0, day_of_week='sunday'),
        'kwargs': {'days': 90},
    },
}


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task for testing Celery setup."""
    print(f'Request: {self.request!r}')
