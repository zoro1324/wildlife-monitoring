"""
Custom permission classes for the Wildlife Monitoring API.

Defines access control for different API endpoints based on user roles and device ownership.
"""

from rest_framework import permissions


class IsDeviceOwner(permissions.BasePermission):
    """
    Permission that allows only the device owner to access the resource.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # obj can be IoTDevice, Image, or any model with device relationship
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'device'):
            return obj.device.owner == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        return False


class IsDeviceAuthenticated(permissions.BasePermission):
    """
    Permission that allows only authenticated IoT devices.
    
    Works with DeviceTokenAuthentication.
    """
    
    def has_permission(self, request, view):
        from .models import IoTDevice
        # Check if the authenticated entity is an IoTDevice
        return isinstance(request.user, IoTDevice)


class IsDeviceOrOwner(permissions.BasePermission):
    """
    Permission that allows either:
    - The authenticated device itself
    - The device's owner
    """
    
    def has_permission(self, request, view):
        from .models import IoTDevice
        # Allow if it's an authenticated device or user
        return (
            isinstance(request.user, IoTDevice) or
            (request.user and request.user.is_authenticated)
        )
    
    def has_object_permission(self, request, view, obj):
        from .models import IoTDevice
        
        # If authenticated as device
        if isinstance(request.user, IoTDevice):
            if hasattr(obj, 'device'):
                return obj.device == request.user
            return obj == request.user
        
        # If authenticated as user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'device'):
            return obj.device.owner == request.user
        elif hasattr(obj, 'user'):
            return obj.user == request.user
        
        return False


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Permission that allows read-only access for authenticated users,
    but requires admin/staff for write operations.
    """
    
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return request.user and request.user.is_staff


class CanManageAlerts(permissions.BasePermission):
    """
    Permission for alert management.
    
    Users can only access their own alerts.
    """
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user
