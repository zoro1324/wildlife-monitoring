from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.contrib.auth import authenticate
import re
from .models import Device


@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    """
    Register a new user.
    Expected data: username, email, password, mobile_number (optional), first_name (optional), last_name (optional)
    """
    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    mobile_number = request.data.get("mobile_number", "")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    # Validation
    if not username or not email or not password:
        return Response(
            {"error": "Username, email, and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate username (alphanumeric and underscores only)
    if not re.match(r"^[a-zA-Z0-9_]+$", username):
        return Response(
            {"error": "Username can only contain letters, numbers, and underscores."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate password length
    if len(password) < 8:
        return Response(
            {"error": "Password must be at least 8 characters long."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if username already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    
    # Check if mobile number already exists (if provided)
    if mobile_number:
        # Basic mobile number validation
        if not re.match(r"^\+?[1-9]\d{1,14}$", mobile_number):
            return Response(
                {"error": "Invalid mobile number format. Use international format (e.g., +1234567890)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        from .models import UserProfile
        if UserProfile.objects.filter(mobile_number=mobile_number).exists():
            return Response(
                {"error": "Mobile number already registered."},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Create user
    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        
        # Save mobile number to profile
        if mobile_number:
            user.profile.mobile_number = mobile_number
            user.profile.save()
        
        # Generate tokens for automatic login after signup
        refresh = RefreshToken.for_user(user)
        
        return Response(
            {
                "message": "User registered successfully.",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "mobile_number": mobile_number,
                },
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"error": f"Failed to create user: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    """
    Login user with username/email/mobile and password.
    Expected data: username (or email or mobile_number), password
    """
    username_or_email_or_mobile = request.data.get("username") or request.data.get("email") or request.data.get("mobile_number")
    password = request.data.get("password")

    if not username_or_email_or_mobile or not password:
        return Response(
            {"error": "Username/email/mobile and password are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Try to find user by username, email, or mobile number
    user = None
    username = None
    
    if "@" in username_or_email_or_mobile:
        # It's an email
        try:
            user = User.objects.get(email=username_or_email_or_mobile)
            username = user.username
        except User.DoesNotExist:
            pass
    elif username_or_email_or_mobile.startswith("+") or username_or_email_or_mobile.isdigit():
        # It's likely a mobile number
        from .models import UserProfile
        try:
            profile = UserProfile.objects.get(mobile_number=username_or_email_or_mobile)
            user = profile.user
            username = user.username
        except UserProfile.DoesNotExist:
            pass
    else:
        # It's a username
        username = username_or_email_or_mobile

    # Authenticate
    user = authenticate(username=username, password=password)

    if user is None:
        return Response(
            {"error": "Invalid credentials."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Account is disabled."},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Generate tokens
    refresh = RefreshToken.for_user(user)
    
    # Get mobile number from profile
    mobile_number = user.profile.mobile_number if hasattr(user, 'profile') else None

    return Response(
        {
            "message": "Login successful.",
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "mobile_number": mobile_number,
            },
            "tokens": {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    """
    Logout user by blacklisting the refresh token.
    Expected data: refresh (refresh token)
    """
    try:
        refresh_token = request.data.get("refresh")
        
        if not refresh_token:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Blacklist the token
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        return Response(
            {"message": "Logout successful."},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        return Response(
            {"error": f"Logout failed: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """
    Get current user profile information.
    """
    user = request.user
    mobile_number = user.profile.mobile_number if hasattr(user, 'profile') else None
    
    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "mobile_number": mobile_number,
            "is_staff": user.is_staff,
            "date_joined": user.date_joined,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def device_message(request):
    """
    Receive device messages from ESP32 and store in database.
    Expected data: {"device_id": "camera_name", "message": "device_data"}
    """
    try:
        device_id = request.data.get("device_id")
        message = request.data.get("message")
        
        if not device_id or not message:
            return Response(
                {"error": "device_id and message are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Create and save device message
        device = Device.objects.create(
            device_id=device_id,
            message=message
        )
        
        return Response(
            {
                "status": "success",
                "message": "Device message stored",
                "device_id": device.device_id,
                "timestamp": device.timestamp.isoformat()
            },
            status=status.HTTP_201_CREATED,
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def test_view(request):
	return Response({"message": "JWT Authentication is working!", "user": str(request.user)})
