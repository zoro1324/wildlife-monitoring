# Wildlife Monitoring API Documentation

## Base URL
```
http://localhost:8000/api/
```

---

## Device Endpoints

### 1. Device Message (ESP32 Connection)

**Endpoint:** `POST /api/device/message/`

**Description:** Receive and store device messages from ESP32 cameras. This endpoint allows ESP32 devices to POST their status, sensor data, or any other information to the server.

**Authentication:** Not required (Public endpoint for IoT devices)

**Request Body:**
```json
{
  "device_id": "camera1",
  "message": "temperature:25,humidity:60,status:ok"
}
```

**Required Fields:**
- `device_id` (string) - Unique identifier for the ESP32 device
- `message` (string) - Message content or sensor data from device

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Device message stored",
  "device_id": "camera1",
  "timestamp": "2026-01-14T10:30:45.123456Z"
}
```

**Error Responses:**

**400 Bad Request** - Missing required fields
```json
{
  "error": "device_id and message are required"
}
```

**500 Internal Server Error** - Server error
```json
{
  "error": "Error message details"
}
```

**Example Usage:**

**cURL:**
```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"front_camera","message":"temperature:25,humidity:60"}'
```

**Python:**
```python
import requests

data = {
    "device_id": "front_camera",
    "message": "temperature:25,humidity:60,status:ok"
}

response = requests.post(
    "http://localhost:8000/api/device/message/",
    json=data
)

print(response.json())
```

**Arduino/ESP32:**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

void sendDeviceMessage() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin("http://your_server_ip:8000/api/device/message/");
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["device_id"] = "camera1";
    doc["message"] = "temperature:25,humidity:60";
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println(response);
    }
    
    http.end();
  }
}
```

**Notes:**
- All messages are automatically timestamped on the server side
- No authentication required for ESP32 devices to POST data
- Messages are stored in order (newest first)
- `message` field can contain any string format (JSON, CSV, plain text, etc.)
- Recommended to use consistent `device_id` for the same device

---

## Authentication Endpoints

### 2. User Signup (Registration)

**Endpoint:** `POST /api/auth/signup/`

**Description:** Register a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepass123",
  "mobile_number": "+1234567890",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Required Fields:**
- `username` - Alphanumeric and underscores only
- `email` - Valid email address
- `password` - Minimum 8 characters

**Optional Fields:**
- `mobile_number` - International format (e.g., +1234567890)
- `first_name`
- `last_name`

**Success Response (201 Created):**
```json
{
  "message": "User registered successfully.",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "mobile_number": "+1234567890"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing required fields, username taken, email already registered

---

### 3. User Login

**Endpoint:** `POST /api/auth/login/`

**Description:** Login with username, email, or mobile number and password.

**Authentication:** Not required

**Request Body (Username):**
```json
{
  "username": "john_doe",
  "password": "securepass123"
}
```

**Request Body (Email):**
```json
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

**Request Body (Mobile):**
```json
{
  "mobile_number": "+1234567890",
  "password": "securepass123"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Login successful.",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "mobile_number": "+1234567890"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Responses:**
- `400 Bad Request` - Missing credentials
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - Account disabled

---

### 4. User Logout

**Endpoint:** `POST /api/auth/logout/`

**Description:** Logout user by blacklisting the refresh token.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh": "your_refresh_token_here"
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logout successful."
}
```

**Error Responses:**
- `400 Bad Request` - Missing or invalid refresh token
- `401 Unauthorized` - Invalid access token

---

### 5. User Profile

**Endpoint:** `GET /api/auth/profile/`

**Description:** Get current user profile information.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+1234567890",
  "is_staff": false,
  "date_joined": "2026-01-14T10:00:00Z"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or missing JWT token

---

## Testing Endpoints

### 6. Test Authentication

**Endpoint:** `GET /api/test/`

**Description:** Test endpoint to verify JWT authentication is working.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
```

**Success Response (200 OK):**
```json
{
  "message": "JWT Authentication is working!",
  "user": "john_doe"
}
```

---

## ESP32 Integration Guide

### Quick Setup for ESP32

1. **Connect ESP32 to WiFi**
2. **Send POST request to device endpoint**
3. **Server automatically stores message with timestamp**

### Example ESP32 Code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* serverUrl = "http://192.168.1.100:8000/api/device/message/";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void loop() {
  // Send device message every 10 seconds
  sendDeviceMessage();
  delay(10000);
}

void sendDeviceMessage() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    // Create JSON payload
    StaticJsonDocument<200> doc;
    doc["device_id"] = "esp32_cam_001";
    doc["message"] = String("temp:") + String(random(20, 30)) + ",status:active";
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.println("Error: " + String(httpResponseCode));
    }
    
    http.end();
  }
}
```

---

## Common Use Cases

### 1. ESP32 Sending Sensor Data
```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"sensor1","message":"temp:25.5,humidity:65,light:450"}'
```

### 2. ESP32 Sending Status Update
```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"camera1","message":"status:online,battery:85%"}'
```

### 3. ESP32 Sending Detection Alert
```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"motion_sensor","message":"detection:animal,confidence:0.95"}'
```

---

## Database Schema

### Device Model
```
id (Auto-generated)
device_id (String) - Device identifier
message (Text) - Message content
timestamp (DateTime) - Auto-generated on creation
```

**Ordering:** Newest messages first (by timestamp descending)

---

## Security Notes

1. **Device Endpoint:** No authentication required for ESP32 devices to send data
2. **User Endpoints:** JWT authentication required for user actions
3. **HTTPS:** Use HTTPS in production to encrypt data in transit
4. **Token Storage:** Store JWT tokens securely
5. **Password Requirements:** Minimum 8 characters

---

## Error Handling

All endpoints return proper HTTP status codes:
- `200 OK` - Success (GET)
- `201 Created` - Success (POST/Create)
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Authentication required/failed
- `403 Forbidden` - Permission denied
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently no rate limiting implemented. Consider adding rate limiting for production use to prevent abuse.

---

## Testing

Make sure the Django server is running:
```bash
cd dashboard/server
python manage.py runserver
```

Test device message endpoint:
```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"test_device","message":"test message"}'
```
