"""
Custom throttling classes for the Wildlife Monitoring API.

Provides rate limiting for different types of API consumers.
"""

from rest_framework.throttling import SimpleRateThrottle


class DeviceRateThrottle(SimpleRateThrottle):
    """
    Throttle for IoT device requests.
    
    Limits the rate at which devices can upload images and send heartbeats.
    """
    scope = 'device'
    
    def get_cache_key(self, request, view):
        """Use device_id as the cache key for throttling."""
        from .models import IoTDevice
        
        if isinstance(request.user, IoTDevice):
            return f"throttle_device_{request.user.device_id}"
        
        # Fall back to IP-based throttling if not a device
        return self.get_ident(request)


class ImageUploadThrottle(SimpleRateThrottle):
    """
    Specific throttle for image uploads.
    
    Stricter rate limit for resource-intensive uploads.
    """
    scope = 'image_upload'
    rate = '60/hour'  # Maximum 60 images per hour per device
    
    def get_cache_key(self, request, view):
        from .models import IoTDevice
        
        if isinstance(request.user, IoTDevice):
            return f"throttle_upload_{request.user.device_id}"
        
        return self.get_ident(request)


class BurstRateThrottle(SimpleRateThrottle):
    """
    Throttle for burst requests (short-term rate limiting).
    
    Prevents sudden spikes in requests.
    """
    scope = 'burst'
    rate = '30/minute'
    
    def get_cache_key(self, request, view):
        from .models import IoTDevice
        
        if isinstance(request.user, IoTDevice):
            return f"throttle_burst_{request.user.device_id}"
        elif request.user and request.user.is_authenticated:
            return f"throttle_burst_user_{request.user.pk}"
        
        return f"throttle_burst_anon_{self.get_ident(request)}"
