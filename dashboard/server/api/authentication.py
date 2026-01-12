"""
Custom authentication classes for the Wildlife Monitoring API.

Provides device token authentication for IoT devices (ESP32-CAM).
"""

from rest_framework import authentication, exceptions
from django.utils import timezone
from .models import DeviceToken


class DeviceTokenAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication for IoT devices using device tokens.
    
    Devices must include the token in the Authorization header:
    Authorization: Device <token>
    
    Or in a custom header:
    X-Device-Token: <token>
    """
    
    keyword = 'Device'
    
    def authenticate(self, request):
        """
        Authenticate the request and return a tuple of (device, token) or None.
        """
        # Try Authorization header first
        auth_header = authentication.get_authorization_header(request).decode('utf-8')
        
        if auth_header:
            parts = auth_header.split()
            
            if parts[0].lower() == self.keyword.lower():
                if len(parts) == 1:
                    raise exceptions.AuthenticationFailed(
                        'Invalid token header. No credentials provided.'
                    )
                elif len(parts) > 2:
                    raise exceptions.AuthenticationFailed(
                        'Invalid token header. Token string should not contain spaces.'
                    )
                
                return self.authenticate_credentials(parts[1])
        
        # Try X-Device-Token header as fallback
        device_token = request.META.get('HTTP_X_DEVICE_TOKEN')
        if device_token:
            return self.authenticate_credentials(device_token)
        
        return None
    
    def authenticate_credentials(self, key):
        """
        Validate the token and return the associated device.
        """
        try:
            token = DeviceToken.objects.select_related('device', 'device__owner').get(
                key=key,
                is_active=True
            )
        except DeviceToken.DoesNotExist:
            raise exceptions.AuthenticationFailed('Invalid or inactive device token.')
        
        if token.device.status == 'maintenance':
            raise exceptions.AuthenticationFailed(
                'Device is under maintenance. Authentication disabled.'
            )
        
        # Update last_used timestamp
        token.last_used = timezone.now()
        token.save(update_fields=['last_used'])
        
        # Update device last_seen
        token.device.save(update_fields=['last_seen'])
        
        # Return device as the authenticated entity (similar to user)
        # The device's owner is accessible via device.owner
        return (token.device, token)
    
    def authenticate_header(self, request):
        """
        Return a string to be used as the value of the WWW-Authenticate
        header in a 401 Unauthenticated response.
        """
        return self.keyword


class DeviceOrUserAuthentication(authentication.BaseAuthentication):
    """
    Combined authentication that accepts either device token or JWT.
    
    Useful for endpoints that can be accessed by both devices and users.
    """
    
    def authenticate(self, request):
        # Try device authentication first
        device_auth = DeviceTokenAuthentication()
        try:
            result = device_auth.authenticate(request)
            if result is not None:
                return result
        except exceptions.AuthenticationFailed:
            pass
        
        # Fall back to JWT authentication
        from rest_framework_simplejwt.authentication import JWTAuthentication
        jwt_auth = JWTAuthentication()
        try:
            return jwt_auth.authenticate(request)
        except exceptions.AuthenticationFailed:
            pass
        
        return None
