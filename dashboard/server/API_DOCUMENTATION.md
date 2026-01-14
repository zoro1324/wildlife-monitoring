# Wildlife Monitoring API Documentation

## Base URL
```
http://localhost:8000/api/
```

## Authentication
This API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
   - [Sign Up](#1-sign-up)
   - [Login](#2-login)
   - [Logout](#3-logout)
   - [User Profile](#4-user-profile)
2. [Device Management Endpoints](#device-management-endpoints)
   - [List Devices](#5-list-devices)
   - [Get Device by ID](#6-get-device-by-id)
   - [Register Device](#7-register-device)
   - [Update Device](#8-update-device)
   - [Delete Device](#9-delete-device)
3. [Device Communication Endpoints](#device-communication-endpoints)
   - [Send Device Message](#10-send-device-message)
   - [Capture Image](#11-capture-image)
4. [Image Management Endpoints](#image-management-endpoints)
   - [List Captured Images](#12-list-captured-images)
5. [Database Schema](#database-schema)
6. [Error Handling](#error-handling)
7. [Code Examples](#code-examples)

---

## Authentication Endpoints

### 1. Sign Up

**Endpoint:** `POST /api/auth/signup/`

**Description:** Register a new user account.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+1234567890"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| username | string | Yes | Alphanumeric and underscores only |
| email | string | Yes | Valid email address |
| password | string | Yes | Minimum 8 characters |
| first_name | string | No | User's first name |
| last_name | string | No | User's last name |
| mobile_number | string | No | International format (e.g., +1234567890) |

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
    "mobile_number": "+1234567890",
    "is_staff": false,
    "date_joined": "2026-01-14T10:30:00.000000Z"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "errors": {
    "username": ["Username already exists."],
    "email": ["Email already registered."],
    "password": ["Ensure this field has at least 8 characters."]
  }
}
```

---

### 2. Login

**Endpoint:** `POST /api/auth/login/`

**Description:** Authenticate user and get JWT tokens. Supports login via username, email, or mobile number.

**Authentication:** Not required

**Request Body (by username):**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Request Body (by email):**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Request Body (by mobile):**
```json
{
  "mobile_number": "+1234567890",
  "password": "securepassword123"
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
    "mobile_number": "+1234567890",
    "is_staff": false,
    "date_joined": "2026-01-14T10:30:00.000000Z"
  },
  "tokens": {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "errors": {
    "non_field_errors": ["Invalid credentials."]
  }
}
```

---

### 3. Logout

**Endpoint:** `POST /api/auth/logout/`

**Description:** Logout user by blacklisting the refresh token.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "message": "Logout successful."
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "Logout failed: Token is blacklisted"
}
```

---

### 4. User Profile

**Endpoint:** `GET /api/auth/profile/`

**Description:** Get current authenticated user's profile information.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
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
  "date_joined": "2026-01-14T10:30:00.000000Z"
}
```

---

## Device Management Endpoints

### 5. List Devices

**Endpoint:** `GET /api/device/`

**Description:** Get list of all registered devices.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "count": 2,
  "devices": [
    {
      "id": 1,
      "device_id": "camera1",
      "lat": 12.9716,
      "lon": 77.5946,
      "owned_by": 1,
      "owned_by_username": "john_doe",
      "created_at": "2026-01-14T10:30:00.000000Z",
      "updated_at": "2026-01-14T10:30:00.000000Z"
    },
    {
      "id": 2,
      "device_id": "camera2",
      "lat": 13.0827,
      "lon": 80.2707,
      "owned_by": null,
      "owned_by_username": null,
      "created_at": "2026-01-14T11:00:00.000000Z",
      "updated_at": "2026-01-14T11:00:00.000000Z"
    }
  ]
}
```

---

### 6. Get Device by ID

**Endpoint:** `GET /api/device/?device_id=camera1`

**Description:** Get a specific device by its device_id.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| device_id | string | Unique device identifier |

**Success Response (200 OK):**
```json
{
  "id": 1,
  "device_id": "camera1",
  "lat": 12.9716,
  "lon": 77.5946,
  "owned_by": 1,
  "owned_by_username": "john_doe",
  "created_at": "2026-01-14T10:30:00.000000Z",
  "updated_at": "2026-01-14T10:30:00.000000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Device not found"
}
```

---

### 7. Register Device

**Endpoint:** `POST /api/device/register/`

**Description:** Register a new device or update existing device information. Used by ESP32 devices to register themselves.

**Authentication:** Not required (for ESP32 devices)

**Request Body:**
```json
{
  "device_id": "camera1",
  "lat": 12.9716,
  "lon": 77.5946,
  "owned_by": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| device_id | string | Yes | Unique device identifier |
| lat | float | No | Latitude coordinate |
| lon | float | No | Longitude coordinate |
| owned_by | integer | No | User ID of device owner |

**Success Response (201 Created - New Device):**
```json
{
  "status": "success",
  "message": "Device registered",
  "device": {
    "id": 1,
    "device_id": "camera1",
    "lat": 12.9716,
    "lon": 77.5946,
    "owned_by": 1,
    "owned_by_username": "john_doe",
    "created_at": "2026-01-14T10:30:00.000000Z",
    "updated_at": "2026-01-14T10:30:00.000000Z"
  }
}
```

**Success Response (200 OK - Device Updated):**
```json
{
  "status": "success",
  "message": "Device updated",
  "device": {
    "id": 1,
    "device_id": "camera1",
    "lat": 13.0827,
    "lon": 80.2707,
    "owned_by": 1,
    "owned_by_username": "john_doe",
    "created_at": "2026-01-14T10:30:00.000000Z",
    "updated_at": "2026-01-14T11:00:00.000000Z"
  }
}
```

---

### 8. Update Device

**Endpoint:** `PUT /api/device/<device_id>/`

**Description:** Update device information (location, owner).

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| device_id | string | Unique device identifier |

**Request Body:**
```json
{
  "lat": 13.0827,
  "lon": 80.2707,
  "owned_by": 2
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| lat | float | No | New latitude coordinate |
| lon | float | No | New longitude coordinate |
| owned_by | integer | No | New owner user ID (null to remove) |

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device updated",
  "device": {
    "id": 1,
    "device_id": "camera1",
    "lat": 13.0827,
    "lon": 80.2707,
    "owned_by": 2,
    "owned_by_username": "jane_doe",
    "created_at": "2026-01-14T10:30:00.000000Z",
    "updated_at": "2026-01-14T11:30:00.000000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "No Device matches the given query."
}
```

---

### 9. Delete Device

**Endpoint:** `DELETE /api/device/<device_id>/`

**Description:** Delete a device and all its associated messages and captured images.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| device_id | string | Unique device identifier |

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device 'camera1' deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "detail": "No Device matches the given query."
}
```

---

## Device Communication Endpoints

### 10. Send Device Message

**Endpoint:** `POST /api/device/message/`

**Description:** Send a connection ping/status message from ESP32 device. Used to verify device is online.

**Authentication:** Not required (for ESP32 devices)

**Request Body:**
```json
{
  "device_id": "camera1",
  "message": "heartbeat"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| device_id | string | Yes | Device identifier |
| message | string | Yes | Message content (e.g., "heartbeat", "online", status data) |

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Device message stored",
  "device_id": "camera1",
  "timestamp": "2026-01-14T10:35:00.000000Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "errors": {
    "device_id": ["This field is required."],
    "message": ["This field is required."]
  }
}
```

---

### 11. Capture Image

**Endpoint:** `POST /api/device/capture/`

**Description:** Upload an image from ESP32 camera. The backend runs YOLO classification and returns the detected animal type and confidence score.

**Authentication:** Not required (for ESP32 devices)

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| device_id | string | Yes | Device identifier |
| image | file | Yes | Image file (JPEG, PNG) - Max 10MB |

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Image captured and classified",
  "data": {
    "id": 1,
    "device_id": "camera1",
    "animal_type": "Tiger",
    "confidence": 0.9523,
    "confidence_percentage": "95.23%",
    "timestamp": "2026-01-14T10:40:00.000000Z",
    "image_url": "http://localhost:8000/media/captured_images/2026/01/14/image.jpg"
  }
}
```

**Response (No Detection):**
```json
{
  "status": "no_detection",
  "message": "No animal detected in the image",
  "data": {
    "device_id": "camera1",
    "animal_type": null,
    "confidence": 0.0,
    "timestamp": null
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "errors": {
    "device_id": ["This field is required."],
    "image": ["No file was submitted."]
  }
}
```

**Supported Animal Types:**
| Index | Animal |
|-------|--------|
| 0 | Bear |
| 1 | Bision |
| 2 | Elephant |
| 3 | Human |
| 4 | Leopord |
| 5 | Lion |
| 6 | Tiger |
| 7 | Wild Boar |

---

## Image Management Endpoints

### 12. List Captured Images

**Endpoint:** `GET /api/images/`

**Description:** Get list of all captured images with optional filtering.

**Authentication:** Required

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| device_id | string | Filter by device identifier |
| animal_type | string | Filter by animal type |

**Example Requests:**
```
GET /api/images/
GET /api/images/?device_id=camera1
GET /api/images/?animal_type=Tiger
GET /api/images/?device_id=camera1&animal_type=Tiger
```

**Success Response (200 OK):**
```json
{
  "count": 3,
  "images": [
    {
      "id": 3,
      "device": 1,
      "device_id": "camera1",
      "image": "/media/captured_images/2026/01/14/image3.jpg",
      "animal_type": "Tiger",
      "confidence": 0.9523,
      "confidence_percentage": "95.23%",
      "timestamp": "2026-01-14T10:45:00.000000Z"
    },
    {
      "id": 2,
      "device": 1,
      "device_id": "camera1",
      "image": "/media/captured_images/2026/01/14/image2.jpg",
      "animal_type": "Elephant",
      "confidence": 0.8765,
      "confidence_percentage": "87.65%",
      "timestamp": "2026-01-14T10:40:00.000000Z"
    },
    {
      "id": 1,
      "device": 2,
      "device_id": "camera2",
      "image": "/media/captured_images/2026/01/14/image1.jpg",
      "animal_type": "Bear",
      "confidence": 0.9234,
      "confidence_percentage": "92.34%",
      "timestamp": "2026-01-14T10:35:00.000000Z"
    }
  ]
}
```

---

## Database Schema

### User Model (Django Built-in)
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| username | String | Unique username |
| email | String | Email address |
| password | String | Hashed password |
| first_name | String | First name |
| last_name | String | Last name |
| is_staff | Boolean | Staff status |
| date_joined | DateTime | Registration date |

### UserProfile Model
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| user | ForeignKey | Link to User |
| mobile_number | String | Phone number (unique) |

### Device Model
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| device_id | String | Unique device identifier |
| lat | Float | Latitude coordinate |
| lon | Float | Longitude coordinate |
| owned_by | ForeignKey | Link to User (nullable) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

### DeviceMessage Model
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| device | ForeignKey | Link to Device (CASCADE) |
| message | Text | Message content |
| timestamp | DateTime | Message timestamp |

### CapturedImage Model
| Field | Type | Description |
|-------|------|-------------|
| id | Integer | Primary key |
| device | ForeignKey | Link to Device (CASCADE) |
| image | ImageField | Image file path |
| animal_type | String | Detected animal type |
| confidence | Float | Detection confidence (0-1) |
| timestamp | DateTime | Capture timestamp |

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request successful |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource not found |
| 500 | Internal Server Error - Server error |

### Error Response Format

**Validation Errors:**
```json
{
  "errors": {
    "field_name": ["Error message 1", "Error message 2"],
    "another_field": ["Error message"]
  }
}
```

**General Errors:**
```json
{
  "error": "Error description"
}
```

**Not Found (Django):**
```json
{
  "detail": "No <Model> matches the given query."
}
```

---

## Code Examples

### Python (requests)

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. Sign Up
response = requests.post(f"{BASE_URL}/auth/signup/", json={
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
})
tokens = response.json()["tokens"]
access_token = tokens["access"]

# 2. Login
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": "testuser",
    "password": "password123"
})
tokens = response.json()["tokens"]

# 3. Get Profile (with auth)
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
print(response.json())

# 4. List Devices (with auth)
response = requests.get(f"{BASE_URL}/device/", headers=headers)
print(response.json())

# 5. Register Device (no auth - for ESP32)
response = requests.post(f"{BASE_URL}/device/register/", json={
    "device_id": "camera1",
    "lat": 12.9716,
    "lon": 77.5946
})
print(response.json())

# 6. Send Device Message (no auth - for ESP32)
response = requests.post(f"{BASE_URL}/device/message/", json={
    "device_id": "camera1",
    "message": "heartbeat"
})
print(response.json())

# 7. Upload Image for Classification (no auth - for ESP32)
with open("test_image.jpg", "rb") as img:
    response = requests.post(
        f"{BASE_URL}/device/capture/",
        data={"device_id": "camera1"},
        files={"image": img}
    )
print(response.json())

# 8. List Captured Images (with auth)
response = requests.get(f"{BASE_URL}/images/", headers=headers)
print(response.json())

# 9. Filter Images by Animal Type
response = requests.get(f"{BASE_URL}/images/?animal_type=Tiger", headers=headers)
print(response.json())

# 10. Logout
response = requests.post(
    f"{BASE_URL}/auth/logout/",
    headers=headers,
    json={"refresh": tokens["refresh"]}
)
print(response.json())
```

### cURL Examples

```bash
# Sign Up
curl -X POST http://localhost:8000/api/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Get Profile
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"

# List Devices
curl -X GET http://localhost:8000/api/device/ \
  -H "Authorization: Bearer <access_token>"

# Register Device
curl -X POST http://localhost:8000/api/device/register/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"camera1","lat":12.9716,"lon":77.5946}'

# Send Device Message
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"camera1","message":"heartbeat"}'

# Upload Image
curl -X POST http://localhost:8000/api/device/capture/ \
  -F "device_id=camera1" \
  -F "image=@/path/to/image.jpg"

# Update Device
curl -X PUT http://localhost:8000/api/device/camera1/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0827,"lon":80.2707}'

# Delete Device
curl -X DELETE http://localhost:8000/api/device/camera1/ \
  -H "Authorization: Bearer <access_token>"

# List Images
curl -X GET http://localhost:8000/api/images/ \
  -H "Authorization: Bearer <access_token>"

# Filter Images by Device
curl -X GET "http://localhost:8000/api/images/?device_id=camera1" \
  -H "Authorization: Bearer <access_token>"
```

### ESP32 Arduino Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverURL = "http://192.168.1.100:8000/api";
const char* deviceId = "esp32_cam_01";

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
  
  // Initialize camera
  camera_config_t config;
  // ... camera configuration ...
  esp_camera_init(&config);
  
  // Register device on startup
  registerDevice();
}

void loop() {
  // Send heartbeat every 10 seconds
  sendHeartbeat();
  delay(10000);
  
  // Capture and send image when motion detected
  if (motionDetected()) {
    captureAndSendImage();
  }
}

void registerDevice() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverURL) + "/device/register/");
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"device_id\":\"" + String(deviceId) + "\",\"lat\":12.9716,\"lon\":77.5946}";
    int httpCode = http.POST(payload);
    
    if (httpCode > 0) {
      Serial.println("Device registered: " + http.getString());
    }
    http.end();
  }
}

void sendHeartbeat() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverURL) + "/device/message/");
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"device_id\":\"" + String(deviceId) + "\",\"message\":\"heartbeat\"}";
    int httpCode = http.POST(payload);
    
    if (httpCode > 0) {
      Serial.println("Heartbeat sent");
    }
    http.end();
  }
}

void captureAndSendImage() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverURL) + "/device/capture/");
    
    // Create multipart form data
    String boundary = "----ESP32Boundary";
    String bodyStart = "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n";
    bodyStart += String(deviceId) + "\r\n";
    bodyStart += "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
    bodyStart += "Content-Type: image/jpeg\r\n\r\n";
    
    String bodyEnd = "\r\n--" + boundary + "--\r\n";
    
    size_t totalLen = bodyStart.length() + fb->len + bodyEnd.length();
    
    uint8_t* payload = (uint8_t*)malloc(totalLen);
    memcpy(payload, bodyStart.c_str(), bodyStart.length());
    memcpy(payload + bodyStart.length(), fb->buf, fb->len);
    memcpy(payload + bodyStart.length() + fb->len, bodyEnd.c_str(), bodyEnd.length());
    
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
    int httpCode = http.POST(payload, totalLen);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Classification result: " + response);
      
      // Parse response to get animal type
      // Use ArduinoJson library for proper parsing
    }
    
    free(payload);
    http.end();
  }
  
  esp_camera_fb_return(fb);
}

bool motionDetected() {
  // Implement motion detection logic
  return false;
}
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/signup/` | No | Register new user |
| POST | `/api/auth/login/` | No | Login user |
| POST | `/api/auth/logout/` | Yes | Logout user |
| GET | `/api/auth/profile/` | Yes | Get user profile |
| GET | `/api/device/` | Yes | List all devices |
| GET | `/api/device/?device_id=<id>` | Yes | Get device by ID |
| POST | `/api/device/register/` | No | Register device |
| PUT | `/api/device/<device_id>/` | Yes | Update device |
| DELETE | `/api/device/<device_id>/` | Yes | Delete device |
| POST | `/api/device/message/` | No | Send device message |
| POST | `/api/device/capture/` | No | Upload image for classification |
| GET | `/api/images/` | Yes | List captured images |
| POST | `/api/token/` | No | Get JWT token pair |
| POST | `/api/token/refresh/` | No | Refresh access token |

---

## Token Refresh

When your access token expires, use the refresh token to get a new access token:

**Endpoint:** `POST /api/token/refresh/`

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESP32 Device Workflow                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Device Startup                                               │
│     └── POST /api/device/register/                               │
│         └── Returns: Device info (id, created_at)                │
│                                                                  │
│  2. Periodic Heartbeat (every 10 seconds)                        │
│     └── POST /api/device/message/                                │
│         └── Returns: timestamp                                   │
│                                                                  │
│  3. Image Capture (on motion/schedule)                           │
│     └── POST /api/device/capture/                                │
│         └── Backend runs YOLO inference                          │
│         └── Returns: animal_type, confidence, image_url          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                     Admin Dashboard Workflow                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User Login                                                   │
│     └── POST /api/auth/login/                                    │
│         └── Returns: access_token, refresh_token                 │
│                                                                  │
│  2. View Devices                                                 │
│     └── GET /api/device/                                         │
│         └── Returns: List of all devices with locations          │
│                                                                  │
│  3. View Captured Images                                         │
│     └── GET /api/images/                                         │
│         └── Returns: List of images with classifications         │
│                                                                  │
│  4. Filter by Animal Type                                        │
│     └── GET /api/images/?animal_type=Tiger                       │
│         └── Returns: Tiger detections only                       │
│                                                                  │
│  5. Manage Devices                                               │
│     └── PUT /api/device/<id>/ - Update location/owner            │
│     └── DELETE /api/device/<id>/ - Remove device                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version:** 1.0  
**Last Updated:** January 14, 2026
