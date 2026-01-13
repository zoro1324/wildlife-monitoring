"""
Custom exception handlers for the Wildlife Monitoring API.

Provides consistent error response formatting across all API endpoints.
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    
    Response format:
    {
        "success": false,
        "error": {
            "code": "ERROR_CODE",
            "message": "Human readable message",
            "details": {} // Optional additional details
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Get the view and request for logging
        view = context.get('view', None)
        request = context.get('request', None)
        
        # Log the exception
        logger.warning(
            f"API Exception: {exc.__class__.__name__} - {str(exc)} "
            f"[View: {view.__class__.__name__ if view else 'Unknown'}]"
        )
        
        # Build custom error response
        error_data = {
            'success': False,
            'error': {
                'code': get_error_code(exc),
                'message': get_error_message(exc, response),
                'details': get_error_details(response.data) if hasattr(response, 'data') else {}
            }
        }
        
        response.data = error_data
    
    return response


def get_error_code(exc):
    """
    Map exception to error code string.
    """
    from rest_framework import exceptions as drf_exceptions
    
    error_codes = {
        drf_exceptions.AuthenticationFailed: 'AUTHENTICATION_FAILED',
        drf_exceptions.NotAuthenticated: 'NOT_AUTHENTICATED',
        drf_exceptions.PermissionDenied: 'PERMISSION_DENIED',
        drf_exceptions.NotFound: 'NOT_FOUND',
        drf_exceptions.ValidationError: 'VALIDATION_ERROR',
        drf_exceptions.ParseError: 'PARSE_ERROR',
        drf_exceptions.Throttled: 'RATE_LIMIT_EXCEEDED',
        drf_exceptions.MethodNotAllowed: 'METHOD_NOT_ALLOWED',
    }
    
    return error_codes.get(type(exc), 'SERVER_ERROR')


def get_error_message(exc, response):
    """
    Get human-readable error message.
    """
    from rest_framework import exceptions as drf_exceptions
    
    if isinstance(exc, drf_exceptions.Throttled):
        return f"Request rate limit exceeded. Try again in {exc.wait} seconds."
    
    if hasattr(exc, 'detail'):
        if isinstance(exc.detail, str):
            return exc.detail
        elif isinstance(exc.detail, list):
            return exc.detail[0] if exc.detail else 'An error occurred'
        elif isinstance(exc.detail, dict):
            # Get first error message from dict
            for key, value in exc.detail.items():
                if isinstance(value, list):
                    return f"{key}: {value[0]}"
                return f"{key}: {value}"
    
    return str(exc)


def get_error_details(data):
    """
    Extract detailed error information from response data.
    """
    if isinstance(data, dict):
        # Filter out non-error keys
        return {k: v for k, v in data.items() if k not in ['detail']}
    return {}


class DeviceOfflineError(Exception):
    """Raised when a device is offline and cannot perform the requested action."""
    pass


class DetectionError(Exception):
    """Raised when AI detection processing fails."""
    pass


class AlertError(Exception):
    """Raised when alert generation fails."""
    pass
