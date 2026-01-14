from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from pathlib import Path
from PIL import Image
import io

from .models import Device, DeviceMessage, CapturedImage
from .serializers import (
    UserSerializer,
    SignupSerializer,
    LoginSerializer,
    LogoutSerializer,
    DeviceSerializer,
    DeviceRegisterSerializer,
    DeviceUpdateSerializer,
    DeviceMessageSerializer,
    DeviceMessageCreateSerializer,
    CapturedImageSerializer,
    CapturedImageUploadSerializer,
)


# ==================== Authentication Views ====================

class SignupView(APIView):
    """Register a new user."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "User registered successfully.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """Login user with username/email/mobile and password."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                "message": "Login successful.",
                "user": UserSerializer(user).data,
                "tokens": {
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                }
            }, status=status.HTTP_200_OK)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """Logout user by blacklisting the refresh token."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        if serializer.is_valid():
            try:
                token = RefreshToken(serializer.validated_data['refresh'])
                token.blacklist()
                return Response({"message": "Logout successful."}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({"error": f"Logout failed: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    """Get current user profile information."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ==================== Device Views ====================

class DeviceListView(generics.ListAPIView):
    """List all devices or filter by device_id."""
    permission_classes = [IsAuthenticated]
    serializer_class = DeviceSerializer
    
    def get_queryset(self):
        queryset = Device.objects.all()
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        return queryset
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        device_id = request.query_params.get('device_id')
        
        if device_id:
            # Return single device
            device = queryset.first()
            if not device:
                return Response({"error": "Device not found"}, status=status.HTTP_404_NOT_FOUND)
            serializer = self.get_serializer(device)
            return Response(serializer.data)
        
        # Return all devices
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "count": queryset.count(),
            "devices": serializer.data
        })


class DeviceRegisterView(APIView):
    """Register or update device information."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = DeviceRegisterSerializer(data=request.data)
        if serializer.is_valid():
            device, created = serializer.save()
            device_serializer = DeviceSerializer(device)
            
            return Response({
                "status": "success",
                "message": "Device registered" if created else "Device updated",
                "device": device_serializer.data
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class DeviceDetailView(APIView):
    """Edit or delete a device."""
    permission_classes = [IsAuthenticated]
    
    def get_object(self, device_id):
        return get_object_or_404(Device, device_id=device_id)
    
    def put(self, request, device_id):
        """Update device information."""
        device = self.get_object(device_id)
        serializer = DeviceUpdateSerializer(device, data=request.data, partial=True)
        
        if serializer.is_valid():
            device = serializer.save()
            device_serializer = DeviceSerializer(device)
            
            return Response({
                "status": "success",
                "message": "Device updated",
                "device": device_serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, device_id):
        """Delete a device and all its associated data."""
        device = self.get_object(device_id)
        device_name = device.device_id
        device.delete()
        
        return Response({
            "status": "success",
            "message": f"Device '{device_name}' deleted successfully"
        }, status=status.HTTP_200_OK)


# ==================== Device Message Views ====================

class DeviceMessageView(APIView):
    """Receive device connection messages/pings from ESP32."""
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = DeviceMessageCreateSerializer(data=request.data)
        if serializer.is_valid():
            device_message = serializer.save()
            
            return Response({
                "status": "success",
                "message": "Device message stored",
                "device_id": device_message.device.device_id,
                "timestamp": device_message.timestamp.isoformat()
            }, status=status.HTTP_201_CREATED)
        
        return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


# ==================== Captured Image Views ====================

class CapturedImageView(APIView):
    """Receive image from ESP32 and run YOLO classification."""
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self._model = None
    
    def get_model(self):
        """Lazy load YOLO model."""
        if self._model is None:
            from ultralytics import YOLO
            model_path = Path(__file__).resolve().parent.parent.parent.parent / "best_models" / "best.pt"
            
            if not model_path.exists():
                raise FileNotFoundError(f"YOLO model not found at {model_path}")
            
            self._model = YOLO(str(model_path))
        return self._model
    
    def classify_image(self, image_file):
        """Run YOLO classification on the image."""
        model = self.get_model()
        
        # Read and process image
        image_data = image_file.read()
        image_file.seek(0)  # Reset file pointer for saving later
        image = Image.open(io.BytesIO(image_data))
        
        # Run inference
        results = model.predict(image, conf=0.25, verbose=False)
        
        animal_type = None
        confidence = 0.0
        
        if results and len(results) > 0:
            result = results[0]
            
            if result.probs is not None:
                # Classification mode
                confidence = float(result.probs.top1conf)
                class_id = int(result.probs.top1)
                animal_type = result.names[class_id]
            elif result.boxes and len(result.boxes) > 0:
                # Detection mode
                best_box = result.boxes[0]
                confidence = float(best_box.conf[0])
                class_id = int(best_box.cls[0])
                animal_type = result.names[class_id]
        
        return animal_type, confidence
    
    def post(self, request):
        serializer = CapturedImageUploadSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({"errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
        
        device_id = serializer.validated_data['device_id']
        image_file = serializer.validated_data['image']
        
        try:
            # Run YOLO classification
            animal_type, confidence = self.classify_image(image_file)
            
            # Handle no detection
            if not animal_type:
                return Response({
                    "status": "no_detection",
                    "message": "No animal detected in the image",
                    "data": {
                        "device_id": device_id,
                        "animal_type": None,
                        "confidence": 0.0,
                        "timestamp": None
                    }
                }, status=status.HTTP_200_OK)
            
            # Validate animal type
            valid_animals = [choice[0] for choice in CapturedImage.ANIMAL_CHOICES]
            if animal_type not in valid_animals:
                animal_type = "Human"  # Default fallback
            
            # Get or create device
            device, _ = Device.objects.get_or_create(device_id=device_id)
            
            # Save captured image
            captured_image = CapturedImage.objects.create(
                device=device,
                image=image_file,
                animal_type=animal_type,
                confidence=confidence
            )
            
            # Build response
            image_url = None
            if captured_image.image:
                image_url = request.build_absolute_uri(captured_image.image.url)
            
            return Response({
                "status": "success",
                "message": "Image captured and classified",
                "data": {
                    "id": captured_image.id,
                    "device_id": captured_image.device.device_id,
                    "animal_type": captured_image.animal_type,
                    "confidence": captured_image.confidence,
                    "confidence_percentage": f"{captured_image.confidence * 100:.2f}%",
                    "timestamp": captured_image.timestamp.isoformat(),
                    "image_url": image_url
                }
            }, status=status.HTTP_201_CREATED)
            
        except FileNotFoundError as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": f"Classification error: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CapturedImageListView(generics.ListAPIView):
    """List all captured images with filtering options."""
    permission_classes = [IsAuthenticated]
    serializer_class = CapturedImageSerializer
    
    def get_queryset(self):
        queryset = CapturedImage.objects.all()
        
        # Filter by device_id
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device__device_id=device_id)
        
        # Filter by animal_type
        animal_type = self.request.query_params.get('animal_type')
        if animal_type:
            queryset = queryset.filter(animal_type=animal_type)
        
        return queryset.order_by('-timestamp')
    
    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            "count": queryset.count(),
            "images": serializer.data
        })


# ==================== Test View ====================

class TestView(APIView):
    """Test endpoint for JWT authentication."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        return Response({
            "message": "JWT Authentication is working!",
            "user": str(request.user)
        })
