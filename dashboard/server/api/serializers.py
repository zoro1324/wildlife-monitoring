from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, Device, DeviceMessage, CapturedImage
import re


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""
    
    class Meta:
        model = UserProfile
        fields = ['mobile_number', 'home_lat', 'home_lon', 'user_type']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with profile."""
    mobile_number = serializers.CharField(source='profile.mobile_number', read_only=True)
    home_lat = serializers.FloatField(source='profile.home_lat', read_only=True)
    home_lon = serializers.FloatField(source='profile.home_lon', read_only=True)
    user_type = serializers.CharField(source='profile.user_type', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'mobile_number', 'home_lat', 'home_lon', 'user_type', 'is_staff', 'date_joined']
        read_only_fields = ['id', 'is_staff', 'date_joined']


class SignupSerializer(serializers.Serializer):
    """Serializer for user registration."""
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    mobile_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    home_lat = serializers.FloatField(required=False, allow_null=True)
    home_lon = serializers.FloatField(required=False, allow_null=True)
    user_type = serializers.ChoiceField(choices=['public', 'ranger'], default='public')
    
    def validate_username(self, value):
        if not re.match(r"^[a-zA-Z0-9_]+$", value):
            raise serializers.ValidationError(
                "Username can only contain letters, numbers, and underscores."
            )
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value
    
    def validate_mobile_number(self, value):
        if value:
            if not re.match(r"^\+?[1-9]\d{1,14}$", value):
                raise serializers.ValidationError(
                    "Invalid mobile number format. Use international format (e.g., +1234567890)."
                )
            if UserProfile.objects.filter(mobile_number=value).exists():
                raise serializers.ValidationError("Mobile number already registered.")
        return value
    
    def create(self, validated_data):
        mobile_number = validated_data.pop('mobile_number', '')
        home_lat = validated_data.pop('home_lat', None)
        home_lon = validated_data.pop('home_lon', None)
        user_type = validated_data.pop('user_type', 'public')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        if mobile_number:
            user.profile.mobile_number = mobile_number
        if home_lat is not None:
            user.profile.home_lat = home_lat
        if home_lon is not None:
            user.profile.home_lon = home_lon
        user.profile.user_type = user_type
        user.profile.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Serializer for user login."""
    username = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    mobile_number = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        email = data.get('email')
        mobile_number = data.get('mobile_number')
        password = data.get('password')
        
        identifier = username or email or mobile_number
        if not identifier:
            raise serializers.ValidationError("Username, email, or mobile number is required.")
        if not password:
            raise serializers.ValidationError("Password is required.")
        
        # Find user by identifier
        user = None
        auth_username = None
        
        if email and "@" in email:
            try:
                user = User.objects.get(email=email)
                auth_username = user.username
            except User.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")
        elif mobile_number or (username and (username.startswith("+") or username.isdigit())):
            mobile = mobile_number or username
            try:
                profile = UserProfile.objects.get(mobile_number=mobile)
                user = profile.user
                auth_username = user.username
            except UserProfile.DoesNotExist:
                raise serializers.ValidationError("Invalid credentials.")
        else:
            auth_username = username
        
        user = authenticate(username=auth_username, password=password)
        
        if user is None:
            raise serializers.ValidationError("Invalid credentials.")
        if not user.is_active:
            raise serializers.ValidationError("Account is disabled.")
        
        data['user'] = user
        return data


class LogoutSerializer(serializers.Serializer):
    """Serializer for user logout."""
    refresh = serializers.CharField()


class DeviceSerializer(serializers.ModelSerializer):
    """Serializer for Device model with access-based location visibility."""
    owned_by_username = serializers.CharField(source='owned_by.username', read_only=True)
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = Device
        fields = ['id', 'device_id', 'location', 'owned_by', 'owned_by_username', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_location(self, obj):
        """Return device location only for rangers and device owners."""
        request = self.context.get('request')
        user = request.user if request else None
        
        # Check if user is ranger or device owner
        is_ranger = user and hasattr(user, 'profile') and user.profile.user_type == 'ranger'
        is_owner = user and obj.owned_by == user
        
        if is_ranger or is_owner:
            return {
                'lat': obj.lat,
                'lon': obj.lon,
                'visible': True
            }
        
        # Return hidden location for public users
        return {
            'lat': None,
            'lon': None,
            'visible': False,
            'message': 'Location hidden for privacy'
        }


class DeviceRegisterSerializer(serializers.Serializer):
    """Serializer for device registration."""
    device_id = serializers.CharField(max_length=100)
    lat = serializers.FloatField(required=False, allow_null=True)
    lon = serializers.FloatField(required=False, allow_null=True)
    owned_by = serializers.IntegerField(required=False, allow_null=True)
    
    def create(self, validated_data):
        device_id = validated_data['device_id']
        owned_by_id = validated_data.pop('owned_by', None)
        
        device, created = Device.objects.get_or_create(device_id=device_id)
        
        if 'lat' in validated_data and validated_data['lat'] is not None:
            device.lat = validated_data['lat']
        if 'lon' in validated_data and validated_data['lon'] is not None:
            device.lon = validated_data['lon']
        if owned_by_id:
            try:
                device.owned_by = User.objects.get(id=owned_by_id)
            except User.DoesNotExist:
                pass
        
        device.save()
        return device, created


class DeviceUpdateSerializer(serializers.Serializer):
    """Serializer for device updates."""
    lat = serializers.FloatField(required=False, allow_null=True)
    lon = serializers.FloatField(required=False, allow_null=True)
    owned_by = serializers.IntegerField(required=False, allow_null=True)
    
    def update(self, instance, validated_data):
        if 'lat' in validated_data:
            instance.lat = validated_data['lat']
        if 'lon' in validated_data:
            instance.lon = validated_data['lon']
        if 'owned_by' in validated_data:
            owned_by_id = validated_data['owned_by']
            if owned_by_id:
                try:
                    instance.owned_by = User.objects.get(id=owned_by_id)
                except User.DoesNotExist:
                    raise serializers.ValidationError({"owned_by": "User not found."})
            else:
                instance.owned_by = None
        
        instance.save()
        return instance


class DeviceMessageSerializer(serializers.ModelSerializer):
    """Serializer for DeviceMessage model."""
    device_id = serializers.CharField(source='device.device_id', read_only=True)
    
    class Meta:
        model = DeviceMessage
        fields = ['id', 'device', 'device_id', 'message', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class DeviceMessageCreateSerializer(serializers.Serializer):
    """Serializer for creating device messages."""
    device_id = serializers.CharField(max_length=100)
    message = serializers.CharField()
    
    def create(self, validated_data):
        device_id = validated_data['device_id']
        message = validated_data['message']
        
        device, _ = Device.objects.get_or_create(device_id=device_id)
        device_message = DeviceMessage.objects.create(device=device, message=message)
        
        return device_message


class CapturedImageSerializer(serializers.ModelSerializer):
    """Serializer for CapturedImage model - returns data based on user access level."""
    device_id = serializers.CharField(source='device.device_id', read_only=True)
    confidence_percentage = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    annotated_image_url = serializers.SerializerMethodField()
    device_location = serializers.SerializerMethodField()
    
    class Meta:
        model = CapturedImage
        fields = ['id', 'device', 'device_id', 'image_url', 'annotated_image_url', 'animal_type', 'confidence', 'confidence_percentage', 'timestamp', 'device_location']
        read_only_fields = ['id', 'timestamp']
    
    def get_confidence_percentage(self, obj):
        return f"{obj.confidence * 100:.2f}%"
    
    def _build_url(self, request, file_field):
        if not file_field:
            return None
        return request.build_absolute_uri(file_field.url) if request else file_field.url

    def get_image_url(self, obj):
        """Return original image (if allowed)."""
        request = self.context.get('request')
        user = request.user if request else None

        # Check if user is ranger or device owner
        is_ranger = user and hasattr(user, 'profile') and user.profile.user_type == 'ranger'
        is_owner = user and obj.device.owned_by == user

        if is_ranger or is_owner:
            return self._build_url(request, obj.image)
        # Public users don't get original image
        return None

    def get_annotated_image_url(self, obj):
        """Return annotated (boxed) image; fallback to original if needed."""
        request = self.context.get('request')
        user = request.user if request else None

        # Check if user is ranger or device owner
        is_ranger = user and hasattr(user, 'profile') and user.profile.user_type == 'ranger'
        is_owner = user and obj.device.owned_by == user

        # Rangers/owners: prefer annotated if available; else original
        if is_ranger or is_owner:
            return self._build_url(request, obj.annotated_image) or self._build_url(request, obj.image)

        # Public users: only annotated; fallback to original if no annotated
        return self._build_url(request, obj.annotated_image) or self._build_url(request, obj.image)
    
    def get_device_location(self, obj):
        """Return device location only for rangers and device owners."""
        request = self.context.get('request')
        user = request.user if request else None
        
        # Check if user is ranger or device owner
        is_ranger = user and hasattr(user, 'profile') and user.profile.user_type == 'ranger'
        is_owner = user and obj.device.owned_by == user
        
        if is_ranger or is_owner:
            return {
                'lat': obj.device.lat,
                'lon': obj.device.lon
            }
        
        # Return approximate/hidden location for public users
        return {
            'lat': None,
            'lon': None,
            'hidden': True,
            'area': 'Location hidden for privacy'
        }


class CapturedImageUploadSerializer(serializers.Serializer):
    """Serializer for image capture upload."""
    device_id = serializers.CharField(max_length=100)
    image = serializers.ImageField()
    
    def validate_image(self, value):
        # Validate image size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image size cannot exceed 10MB.")
        return value


class UserProfileUpdateSerializer(serializers.Serializer):
    """Serializer for updating user profile (home location)."""
    home_lat = serializers.FloatField(required=False, allow_null=True)
    home_lon = serializers.FloatField(required=False, allow_null=True)
    mobile_number = serializers.CharField(max_length=15, required=False, allow_blank=True)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    
    def validate_mobile_number(self, value):
        if value:
            if not re.match(r"^\+?[1-9]\d{1,14}$", value):
                raise serializers.ValidationError(
                    "Invalid mobile number format. Use international format (e.g., +1234567890)."
                )
            # Check if mobile number is already used by another user
            user = self.context.get('user')
            if UserProfile.objects.filter(mobile_number=value).exclude(user=user).exists():
                raise serializers.ValidationError("Mobile number already registered.")
        return value
    
    def update(self, instance, validated_data):
        user = instance
        profile = user.profile
        
        if 'first_name' in validated_data:
            user.first_name = validated_data['first_name']
        if 'last_name' in validated_data:
            user.last_name = validated_data['last_name']
        user.save()
        
        if 'home_lat' in validated_data:
            profile.home_lat = validated_data['home_lat']
        if 'home_lon' in validated_data:
            profile.home_lon = validated_data['home_lon']
        if 'mobile_number' in validated_data:
            profile.mobile_number = validated_data['mobile_number'] or None
        profile.save()
        
        return user


class AddDeviceSerializer(serializers.Serializer):
    """Serializer for adding a device to user's account."""
    device_id = serializers.CharField(max_length=100)
    name = serializers.CharField(max_length=200, required=False, allow_blank=True)
    lat = serializers.FloatField(required=False, allow_null=True)
    lon = serializers.FloatField(required=False, allow_null=True)
    
    def validate_device_id(self, value):
        # Check if device already exists and is owned by another user
        try:
            device = Device.objects.get(device_id=value)
            if device.owned_by and device.owned_by != self.context.get('user'):
                raise serializers.ValidationError("This device is already registered to another user.")
        except Device.DoesNotExist:
            pass  # Device will be created
        return value
    
    def create(self, validated_data):
        device_id = validated_data['device_id']
        user = self.context.get('user')
        
        device, created = Device.objects.get_or_create(device_id=device_id)
        device.owned_by = user
        
        if 'lat' in validated_data and validated_data['lat'] is not None:
            device.lat = validated_data['lat']
        if 'lon' in validated_data and validated_data['lon'] is not None:
            device.lon = validated_data['lon']
        
        device.save()
        return device, created
