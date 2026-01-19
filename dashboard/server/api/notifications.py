"""
Twilio notification service for wildlife alerts.
Sends WhatsApp messages to nearby users and makes calls to device owners.
"""

import math
import threading
from django.conf import settings
from django.contrib.auth.models import User


def get_twilio_client():
    """Get Twilio client lazily to avoid import errors if not configured."""
    try:
        from twilio.rest import Client
        account_sid = getattr(settings, 'TWILIO_ACCOUNT_SID', None)
        auth_token = getattr(settings, 'TWILIO_AUTH_TOKEN', None)
        
        if not account_sid or not auth_token:
            print("Twilio credentials not configured")
            return None
        
        return Client(account_sid, auth_token)
    except ImportError:
        print("Twilio library not installed. Run: pip install twilio")
        return None
    except Exception as e:
        print(f"Error initializing Twilio client: {e}")
        return None


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points on Earth (in kilometers).
    Uses the Haversine formula.
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat / 2) ** 2 + \
        math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    return R * c


def get_users_within_radius(device_lat, device_lon, radius_km=10, user_type=None):
    """
    Get all users whose home location is within the specified radius of the device.
    
    Args:
        device_lat: Device latitude
        device_lon: Device longitude
        radius_km: Radius in kilometers (default 10km)
    
    Returns:
        QuerySet of User objects within radius
    """
    from .models import UserProfile
    
    nearby_users = []
    
    # Get all profiles with home coordinates
    profiles = UserProfile.objects.filter(
        home_lat__isnull=False,
        home_lon__isnull=False,
        mobile_number__isnull=False
    ).exclude(mobile_number='')

    if user_type:
        profiles = profiles.filter(user_type=user_type)
    
    for profile in profiles:
        distance = haversine_distance(
            device_lat, device_lon,
            profile.home_lat, profile.home_lon
        )
        
        if distance <= radius_km:
            nearby_users.append({
                'user': profile.user,
                'mobile_number': profile.mobile_number,
                'distance': distance
            })
    
    return nearby_users


def send_whatsapp_message(to_number, message):
    """
    Send a WhatsApp message using Twilio.
    
    Args:
        to_number: Recipient's phone number in international format (e.g., +1234567890)
        message: Message body to send
    
    Returns:
        Message SID if successful, None otherwise
    """
    client = get_twilio_client()
    if not client:
        return None
    
    try:
        from_whatsapp = getattr(settings, 'TWILIO_WHATSAPP_NUMBER', None)
        if not from_whatsapp:
            print("TWILIO_WHATSAPP_NUMBER not configured")
            return None
        
        # Ensure proper WhatsApp format
        if not to_number.startswith('whatsapp:'):
            to_number = f'whatsapp:{to_number}'
        if not from_whatsapp.startswith('whatsapp:'):
            from_whatsapp = f'whatsapp:{from_whatsapp}'
        
        message = client.messages.create(
            body=message,
            from_=from_whatsapp,
            to=to_number
        )
        
        print(f"WhatsApp message sent to {to_number}: {message.sid}")
        return message.sid
    except Exception as e:
        print(f"Error sending WhatsApp message to {to_number}: {e}")
        return None


def send_sms_message(to_number, message):
    """
    Send an SMS message using Twilio.
    
    Args:
        to_number: Recipient's phone number in international format (e.g., +1234567890)
        message: Message body to send
    
    Returns:
        Message SID if successful, None otherwise
    """
    client = get_twilio_client()
    if not client:
        return None

    try:
        from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)
        if not from_number:
            print("TWILIO_PHONE_NUMBER not configured")
            return None

        message_obj = client.messages.create(
            body=message,
            from_=from_number,
            to=to_number
        )

        print(f"SMS sent to {to_number}: {message_obj.sid}")
        return message_obj.sid
    except Exception as e:
        print(f"Error sending SMS to {to_number}: {e}")
        return None


def make_phone_call(to_number, message):
    """
    Make a phone call using Twilio with TwiML voice message.
    
    Args:
        to_number: Recipient's phone number in international format
        message: Message to be read aloud during the call
    
    Returns:
        Call SID if successful, None otherwise
    """
    client = get_twilio_client()
    if not client:
        return None
    
    try:
        from_number = getattr(settings, 'TWILIO_PHONE_NUMBER', None)
        if not from_number:
            print("TWILIO_PHONE_NUMBER not configured")
            return None
        
        # Create TwiML response with the message
        twiml = f'<Response><Say voice="alice">{message}</Say><Pause length="1"/><Say voice="alice">{message}</Say></Response>'
        
        call = client.calls.create(
            twiml=twiml,
            to=to_number,
            from_=from_number
        )
        
        print(f"Phone call initiated to {to_number}: {call.sid}")
        return call.sid
    except Exception as e:
        print(f"Error making phone call to {to_number}: {e}")
        return None


def send_wildlife_alerts(device, animal_type, confidence, image_url=None):
    """
    Send wildlife alerts to nearby users via WhatsApp and call device owner.
    Runs in a background thread to not block the API response.
    
    Args:
        device: Device model instance
        animal_type: Type of animal detected
        confidence: Detection confidence (0-1)
        image_url: Optional URL to the captured image
    """
    def _send_alerts():
        try:
            device_lat = device.lat
            device_lon = device.lon
            
            if device_lat is None or device_lon is None:
                print(f"Device {device.device_id} has no location coordinates. Skipping alerts.")
                return
            
            confidence_pct = f"{confidence * 100:.1f}%"
            
            # Compose alert message
            alert_message = (
                f"🚨 WILDLIFE ALERT 🚨\n\n"
                f"Animal Detected: {animal_type}\n"
                f"Confidence: {confidence_pct}\n"
                f"Device: {device.device_id}\n"
                f"Location: {device_lat:.6f}, {device_lon:.6f}\n\n"
                f"Please stay alert and take necessary precautions!"
            )
            
            if image_url:
                alert_message += f"\n\nImage: {image_url}"
            
            # Get rangers within 50km radius and public users within 10km radius
            nearby_rangers = get_users_within_radius(device_lat, device_lon, radius_km=50, user_type='ranger')
            nearby_public = get_users_within_radius(device_lat, device_lon, radius_km=10, user_type='public')
            
            print(
                f"Found {len(nearby_rangers)} rangers within 50km and {len(nearby_public)} public users within 10km of device {device.device_id}"
            )
            
            # Track device owner to avoid duplicate WhatsApp message
            device_owner_id = device.owned_by.id if device.owned_by else None
            
            # Send WhatsApp messages to nearby users
            for user_info in nearby_rangers + nearby_public:
                user = user_info['user']
                mobile = user_info['mobile_number']
                distance = user_info['distance']
                
                personalized_message = (
                    f"{alert_message}\n\n"
                    f"Distance from your home: {distance:.1f} km"
                )
                
                print(f"Sending WhatsApp to {user.username} ({mobile}) - {distance:.1f}km away")
                send_whatsapp_message(mobile, personalized_message)
            
            # Make a call to the device owner
            if device.owned_by and device.owned_by.profile.mobile_number:
                owner = device.owned_by
                owner_mobile = owner.profile.mobile_number
                
                call_message = (
                    f"Wildlife Alert! A {animal_type} has been detected by your device {device.device_id}. "
                    f"Detection confidence is {confidence_pct}. "
                    f"Please check your device immediately and take necessary safety precautions."
                )
                
                print(f"Calling device owner {owner.username} ({owner_mobile})")
                make_phone_call(owner_mobile, call_message)
            else:
                print(f"Device {device.device_id} has no owner or owner has no mobile number. Skipping call.")
                
        except Exception as e:
            print(f"Error sending wildlife alerts: {e}")
            import traceback
            traceback.print_exc()
    
    # Run in background thread
    thread = threading.Thread(target=_send_alerts, daemon=True)
    thread.start()
    print(f"Wildlife alert thread started for {animal_type} detection on device {device.device_id}")
