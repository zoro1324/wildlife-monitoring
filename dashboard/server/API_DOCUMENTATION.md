<!-- markdownlint-disable MD031 MD032 MD040 MD058 MD060 -->
# Wildlife Monitoring API Documentation

## Overview

This document provides comprehensive documentation for the Wildlife Monitoring System REST API. The API enables ESP32-CAM devices to register, send heartbeats, and upload wildlife images for AI-powered classification. It also provides endpoints for the React dashboard to manage devices, view detections, and handle user authentication.

## Base URL

```
http://localhost:8000/api/
```

## Authentication

This API uses **JWT (JSON Web Token)** authentication. Most endpoints require authentication via the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token Lifetime:**
- Access Token: 60 minutes (configurable)
- Refresh Token: 7 days (configurable)

---

## Table of Contents

1. [Authentication Endpoints](#1-authentication-endpoints)
   - [Sign Up](#11-sign-up)
   - [Login](#12-login)
   - [Logout](#13-logout)
   - [User Profile](#14-user-profile)
   - [Token Refresh](#15-token-refresh)
2. [User Device Endpoints](#2-user-device-endpoints)
   - [Get My Devices](#21-get-my-devices)
   - [Add Device](#22-add-device)
   - [Remove Device](#23-remove-device)
3. [Device Management Endpoints](#3-device-management-endpoints)
   - [List All Devices](#31-list-all-devices)
   - [Get Device by ID](#32-get-device-by-id)
   - [Register Device](#33-register-device)
   - [Update Device](#34-update-device)
   - [Delete Device](#35-delete-device)
4. [Device Communication Endpoints](#4-device-communication-endpoints)
   - [Send Heartbeat/Message](#41-send-heartbeatmessage)
   - [Capture Image](#42-capture-image)
5. [Image Endpoints](#5-image-endpoints)
   - [List Captured Images](#51-list-captured-images)
6. [Database Schema](#6-database-schema)
7. [Error Handling](#7-error-handling)
8. [Code Examples](#8-code-examples)
9. [API Summary Table](#9-api-summary-table)
10. [Workflow Diagrams](#10-workflow-diagrams)

---

## 1. Authentication Endpoints

### 1.1 Sign Up

**Endpoint:** `POST /api/auth/signup/`

**Description:** Register a new user account with optional home location for proximity alerts.

**Authentication:** Not required

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+1234567890",
  "home_lat": 12.9716,
  "home_lon": 77.5946,
  "user_type": "public"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Alphanumeric and underscores only |
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Minimum 8 characters |
| `first_name` | string | No | User's first name |
| `last_name` | string | No | User's last name |
| `mobile_number` | string | No | International format (e.g., `+1234567890`) |
| `home_lat` | float | No | Home latitude for proximity alerts |
| `home_lon` | float | No | Home longitude for proximity alerts |
| `user_type` | string | No | `public` (default) or `ranger` |

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
    "home_lat": 12.9716,
    "home_lon": 77.5946,
    "user_type": "public",
    "is_staff": false,
    "date_joined": "2026-01-15T10:30:00.000000Z"
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
    "password": ["Ensure this field has at least 8 characters."],
    "mobile_number": ["Mobile number already registered."]
  }
}
```

---

### 1.2 Login

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
    "home_lat": 12.9716,
    "home_lon": 77.5946,
    "user_type": "public",
    "is_staff": false,
    "date_joined": "2026-01-15T10:30:00.000000Z"
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

### 1.3 Logout

**Endpoint:** `POST /api/auth/logout/`

**Description:** Logout user by blacklisting the refresh token.

**Authentication:** Required

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

---

### 1.4 User Profile

**Endpoint:** `GET /api/auth/profile/` | `PUT /api/auth/profile/`

**Description:** Get or update current user's profile information including home location.

**Authentication:** Required

#### GET - Retrieve Profile

**Success Response (200 OK):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+1234567890",
  "home_lat": 12.9716,
  "home_lon": 77.5946,
  "user_type": "public",
  "is_staff": false,
  "date_joined": "2026-01-15T10:30:00.000000Z"
}
```

#### PUT - Update Profile

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "mobile_number": "+1234567890",
  "home_lat": 13.0827,
  "home_lon": 80.2707
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `first_name` | string | No | Updated first name |
| `last_name` | string | No | Updated last name |
| `mobile_number` | string | No | Updated mobile (international format) |
| `home_lat` | float | No | Updated home latitude |
| `home_lon` | float | No | Updated home longitude |

**Success Response (200 OK):**
```json
{
  "message": "Profile updated successfully.",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "mobile_number": "+1234567890",
    "home_lat": 13.0827,
    "home_lon": 80.2707,
    "user_type": "public",
    "is_staff": false,
    "date_joined": "2026-01-15T10:30:00.000000Z"
  }
}
```

---

### 1.5 Token Refresh

**Endpoint:** `POST /api/token/refresh/`

**Description:** Get a new access token using a valid refresh token.

**Authentication:** Not required

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

## 2. User Device Endpoints

These endpoints allow users to manage their own devices.

### 2.1 Get My Devices

**Endpoint:** `GET /api/user/devices/`

**Description:** Get all devices owned by the currently authenticated user.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "count": 2,
  "devices": [
    {
      "id": 1,
      "device_id": "my-camera-01",
      "location": {
        "lat": 12.9716,
        "lon": 77.5946,
        "visible": true
      },
      "owned_by": 1,
      "owned_by_username": "john_doe",
      "created_at": "2026-01-15T10:30:00.000000Z",
      "updated_at": "2026-01-15T10:30:00.000000Z"
    }
  ]
}
```

---

### 2.2 Add Device

**Endpoint:** `POST /api/user/devices/`

**Description:** Add a new device or claim an existing unassigned device.

**Authentication:** Required

**Request Body:**
```json
{
  "device_id": "my-new-camera",
  "lat": 12.9716,
  "lon": 77.5946
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_id` | string | Yes | Unique device identifier |
| `lat` | float | No | Device latitude |
| `lon` | float | No | Device longitude |

**Success Response (201 Created - New Device):**
```json
{
  "status": "success",
  "message": "Device added successfully",
  "device": {
    "id": 3,
    "device_id": "my-new-camera",
    "location": {
      "lat": 12.9716,
      "lon": 77.5946,
      "visible": true
    },
    "owned_by": 1,
    "owned_by_username": "john_doe",
    "created_at": "2026-01-15T12:00:00.000000Z",
    "updated_at": "2026-01-15T12:00:00.000000Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "errors": {
    "device_id": ["This device is already registered to another user."]
  }
}
```

---

### 2.3 Remove Device

**Endpoint:** `DELETE /api/user/devices/?device_id=<device_id>`

**Description:** Remove a device from user's account (unlinks ownership, doesn't delete device).

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_id` | string | Device ID to remove |

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device removed from your account"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Device not found or not owned by you"
}
```

---

## 3. Device Management Endpoints

### 3.1 List All Devices

**Endpoint:** `GET /api/device/`

**Description:** Get list of all registered devices. Location visibility depends on user role.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "count": 3,
  "devices": [
    {
      "id": 1,
      "device_id": "camera-forest-01",
      "location": {
        "lat": 12.9716,
        "lon": 77.5946,
        "visible": true
      },
      "owned_by": 1,
      "owned_by_username": "john_doe",
      "created_at": "2026-01-15T10:30:00.000000Z",
      "updated_at": "2026-01-15T10:30:00.000000Z"
    },
    {
      "id": 2,
      "device_id": "camera-river-02",
      "location": {
        "lat": null,
        "lon": null,
        "visible": false,
        "message": "Location hidden for privacy"
      },
      "owned_by": 2,
      "owned_by_username": "jane_doe",
      "created_at": "2026-01-15T11:00:00.000000Z",
      "updated_at": "2026-01-15T11:00:00.000000Z"
    }
  ]
}
```

**Note:** Rangers see all device locations. Public users only see their own devices' locations.

---

### 3.2 Get Device by ID

**Endpoint:** `GET /api/device/?device_id=<device_id>`

**Description:** Get a specific device by its device_id.

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_id` | string | Unique device identifier |

**Success Response (200 OK):**
```json
{
  "id": 1,
  "device_id": "camera-forest-01",
  "location": {
    "lat": 12.9716,
    "lon": 77.5946,
    "visible": true
  },
  "owned_by": 1,
  "owned_by_username": "john_doe",
  "created_at": "2026-01-15T10:30:00.000000Z",
  "updated_at": "2026-01-15T10:30:00.000000Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Device not found"
}
```

---

### 3.3 Register Device

**Endpoint:** `POST /api/device/register/`

**Description:** Register a new device or update existing device information. Used by ESP32 devices on startup.

**Authentication:** Not required (for ESP32 devices)

**Request Body:**
```json
{
  "device_id": "esp32-cam-01",
  "lat": 12.9716,
  "lon": 77.5946,
  "owned_by": 1
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_id` | string | Yes | Unique device identifier |
| `lat` | float | No | Latitude coordinate |
| `lon` | float | No | Longitude coordinate |
| `owned_by` | integer | No | User ID of device owner |

**Success Response (201 Created - New Device):**
```json
{
  "status": "success",
  "message": "Device registered",
  "device": {
    "id": 1,
    "device_id": "esp32-cam-01",
    "location": {
      "lat": 12.9716,
      "lon": 77.5946,
      "visible": true
    },
    "owned_by": 1,
    "owned_by_username": "john_doe",
    "created_at": "2026-01-15T10:30:00.000000Z",
    "updated_at": "2026-01-15T10:30:00.000000Z"
  }
}
```

**Success Response (200 OK - Device Updated):**
```json
{
  "status": "success",
  "message": "Device updated",
  "device": { ... }
}
```

---

### 3.4 Update Device

**Endpoint:** `PUT /api/device/<device_id>/`

**Description:** Update device information (location, owner).

**Authentication:** Required

**URL Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_id` | string | Unique device identifier |

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
| `lat` | float | No | New latitude coordinate |
| `lon` | float | No | New longitude coordinate |
| `owned_by` | integer/null | No | New owner user ID (null to remove) |

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device updated",
  "device": { ... }
}
```

---

### 3.5 Delete Device

**Endpoint:** `DELETE /api/device/<device_id>/`

**Description:** Delete a device and all its associated messages and captured images.

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "status": "success",
  "message": "Device 'esp32-cam-01' deleted successfully"
}
```

---

## 4. Device Communication Endpoints

### 4.1 Send Heartbeat/Message

**Endpoint:** `POST /api/device/message/`

**Description:** Send a connection ping/status message from ESP32 device. Used to verify device is online.

**Authentication:** Not required (for ESP32 devices)

**Request Body:**
```json
{
  "device_id": "esp32-cam-01",
  "message": "heartbeat"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_id` | string | Yes | Device identifier |
| `message` | string | Yes | Message content (e.g., "heartbeat", "online", status data) |

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Device message stored",
  "device_id": "esp32-cam-01",
  "timestamp": "2026-01-15T10:35:00.000000Z"
}
```

---

### 4.2 Capture Image

**Endpoint:** `POST /api/device/capture/`

**Description:** Upload an image from ESP32 camera. The backend runs YOLOv8 classification and returns the detected animal type, confidence score, and annotated image. Sends alerts to nearby users if dangerous wildlife is detected.

**Authentication:** Not required (for ESP32 devices)

**Headers:**
```
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `device_id` | string | Yes | Device identifier |
| `image` | file | Yes | Image file (JPEG, PNG) - Max 10MB |

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Image captured and classified",
  "data": {
    "id": 1,
    "device_id": "esp32-cam-01",
    "animal_type": "Tiger",
    "confidence": 0.9523,
    "confidence_percentage": "95.23%",
    "timestamp": "2026-01-15T10:40:00.000000Z",
    "image_url": "http://localhost:8000/media/captured_images/2026/01/15/image.jpg",
    "annotated_image_url": "http://localhost:8000/media/annotated_images/2026/01/15/annotated_1.jpg"
  }
}
```

**Response (No Detection):**
```json
{
  "status": "no_detection",
  "message": "No animal detected in the image",
  "data": {
    "device_id": "esp32-cam-01",
    "animal_type": null,
    "confidence": 0.0,
    "timestamp": null
  }
}
```

**Supported Animal Types:**

| Class | Animal | Risk Level |
|-------|--------|------------|
| 0 | Bear | 🟡 Medium |
| 1 | Bison | 🟢 Low |
| 2 | Elephant | 🟡 Medium |
| 3 | Human | 🔴 High |
| 4 | Leopard | 🔴 High |
| 5 | Lion | 🔴 High |
| 6 | Tiger | 🔴 High |
| 7 | Wild Boar | 🟡 Medium |

**Alert Behavior:**
- High-risk animals trigger: WhatsApp messages to users within 10km + Phone call to device owner
- Medium-risk animals trigger: WhatsApp messages to users within 10km
- Low-risk animals: Logged only, no alerts

---

## 5. Image Endpoints

### 5.1 List Captured Images

**Endpoint:** `GET /api/images/`

**Description:** Get list of captured images with YOLO classifications. Access level determines what data is returned:

- **Rangers:** See all images from all devices with full details
- **Device Owners:** See only images from their own devices
- **Public Users (no devices):** See only recent alerts (last 24 hours) without exact locations

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `device_id` | string | Filter by device identifier |
| `animal_type` | string | Filter by animal type |

**Example Requests:**
```
GET /api/images/
GET /api/images/?device_id=esp32-cam-01
GET /api/images/?animal_type=Tiger
GET /api/images/?device_id=esp32-cam-01&animal_type=Tiger
```

**Success Response (200 OK):**
```json
{
  "count": 3,
  "images": [
    {
      "id": 3,
      "device": 1,
      "device_id": "esp32-cam-01",
      "image_url": "http://localhost:8000/media/captured_images/2026/01/15/image3.jpg",
      "annotated_image_url": "http://localhost:8000/media/annotated_images/2026/01/15/annotated_3.jpg",
      "animal_type": "Tiger",
      "confidence": 0.9523,
      "confidence_percentage": "95.23%",
      "timestamp": "2026-01-15T10:45:00.000000Z",
      "device_location": {
        "lat": 12.9716,
        "lon": 77.5946
      }
    },
    {
      "id": 2,
      "device": 1,
      "device_id": "esp32-cam-01",
      "image_url": null,
      "annotated_image_url": "http://localhost:8000/media/annotated_images/2026/01/15/annotated_2.jpg",
      "animal_type": "Elephant",
      "confidence": 0.8765,
      "confidence_percentage": "87.65%",
      "timestamp": "2026-01-15T10:40:00.000000Z",
      "device_location": {
        "lat": null,
        "lon": null,
        "hidden": true,
        "area": "Location hidden for privacy"
      }
    }
  ],
  "access_level": "ranger",
  "owned_devices_count": 2
}
```

**Access Level Values:**
- `ranger` - Full access to all data
- `device_owner` - Access to own devices only
- `public` - Limited access (recent alerts only)

---

## 6. Database Schema

### User Model (Django Built-in)

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `username` | String | Unique username |
| `email` | String | Email address |
| `password` | String | Hashed password |
| `first_name` | String | First name |
| `last_name` | String | Last name |
| `is_staff` | Boolean | Staff status |
| `date_joined` | DateTime | Registration date |

### UserProfile Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `user` | ForeignKey(User) | One-to-one link to User |
| `mobile_number` | String | Phone number (unique, nullable) |
| `home_lat` | Float | Home latitude (nullable) |
| `home_lon` | Float | Home longitude (nullable) |
| `user_type` | String | `public` or `ranger` |

### Device Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `device_id` | String | Unique device identifier |
| `lat` | Float | Latitude coordinate (nullable) |
| `lon` | Float | Longitude coordinate (nullable) |
| `owned_by` | ForeignKey(User) | Device owner (nullable, SET_NULL) |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last update timestamp |

### DeviceMessage Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `device` | ForeignKey(Device) | Link to Device (CASCADE) |
| `message` | Text | Message content |
| `timestamp` | DateTime | Message timestamp |

### CapturedImage Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `device` | ForeignKey(Device) | Link to Device (CASCADE) |
| `image` | ImageField | Original image file path |
| `annotated_image` | ImageField | YOLO-annotated image (nullable) |
| `animal_type` | String | Detected animal type |
| `confidence` | Float | Detection confidence (0-1) |
| `timestamp` | DateTime | Capture timestamp |

---

## 7. Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | OK - Request successful |
| `201` | Created - Resource created successfully |
| `400` | Bad Request - Invalid input data |
| `401` | Unauthorized - Invalid or missing token |
| `403` | Forbidden - Access denied |
| `404` | Not Found - Resource not found |
| `500` | Internal Server Error - Server error |

### Error Response Formats

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

**Django Not Found:**
```json
{
  "detail": "No <Model> matches the given query."
}
```

---

## 8. Code Examples

### Python (requests library)

```python
import requests

BASE_URL = "http://localhost:8000/api"

# 1. Sign Up
response = requests.post(f"{BASE_URL}/auth/signup/", json={
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "home_lat": 12.9716,
    "home_lon": 77.5946,
    "user_type": "public"
})
tokens = response.json()["tokens"]
access_token = tokens["access"]

# 2. Login
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": "testuser",
    "password": "password123"
})
tokens = response.json()["tokens"]

# 3. Get Profile (authenticated)
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.get(f"{BASE_URL}/auth/profile/", headers=headers)
print(response.json())

# 4. Update Home Location
response = requests.put(f"{BASE_URL}/auth/profile/", headers=headers, json={
    "home_lat": 13.0827,
    "home_lon": 80.2707
})

# 5. List My Devices
response = requests.get(f"{BASE_URL}/user/devices/", headers=headers)
print(response.json())

# 6. Add Device to My Account
response = requests.post(f"{BASE_URL}/user/devices/", headers=headers, json={
    "device_id": "my-camera-01",
    "lat": 12.9716,
    "lon": 77.5946
})

# 7. List All Devices
response = requests.get(f"{BASE_URL}/device/", headers=headers)
print(response.json())

# 8. Register Device (no auth - for ESP32)
response = requests.post(f"{BASE_URL}/device/register/", json={
    "device_id": "esp32-cam-01",
    "lat": 12.9716,
    "lon": 77.5946
})
print(response.json())

# 9. Send Heartbeat (no auth - for ESP32)
response = requests.post(f"{BASE_URL}/device/message/", json={
    "device_id": "esp32-cam-01",
    "message": "heartbeat"
})
print(response.json())

# 10. Upload Image for Classification (no auth - for ESP32)
with open("test_image.jpg", "rb") as img:
    response = requests.post(
        f"{BASE_URL}/device/capture/",
        data={"device_id": "esp32-cam-01"},
        files={"image": img}
    )
print(response.json())

# 11. List Captured Images (authenticated)
response = requests.get(f"{BASE_URL}/images/", headers=headers)
print(response.json())

# 12. Filter Images by Animal Type
response = requests.get(f"{BASE_URL}/images/?animal_type=Tiger", headers=headers)
print(response.json())

# 13. Logout
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
  -d '{"username":"testuser","email":"test@example.com","password":"password123","user_type":"public"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Get Profile
curl -X GET http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>"

# Update Profile (Home Location)
curl -X PUT http://localhost:8000/api/auth/profile/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"home_lat":12.9716,"home_lon":77.5946}'

# List My Devices
curl -X GET http://localhost:8000/api/user/devices/ \
  -H "Authorization: Bearer <access_token>"

# Add Device
curl -X POST http://localhost:8000/api/user/devices/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"my-camera","lat":12.9716,"lon":77.5946}'

# Remove Device
curl -X DELETE "http://localhost:8000/api/user/devices/?device_id=my-camera" \
  -H "Authorization: Bearer <access_token>"

# List All Devices
curl -X GET http://localhost:8000/api/device/ \
  -H "Authorization: Bearer <access_token>"

# Register Device (ESP32)
curl -X POST http://localhost:8000/api/device/register/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-cam-01","lat":12.9716,"lon":77.5946}'

# Send Heartbeat (ESP32)
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-cam-01","message":"heartbeat"}'

# Upload Image (ESP32)
curl -X POST http://localhost:8000/api/device/capture/ \
  -F "device_id=esp32-cam-01" \
  -F "image=@/path/to/image.jpg"

# List Images
curl -X GET http://localhost:8000/api/images/ \
  -H "Authorization: Bearer <access_token>"

# Filter by Animal Type
curl -X GET "http://localhost:8000/api/images/?animal_type=Tiger" \
  -H "Authorization: Bearer <access_token>"

# Update Device
curl -X PUT http://localhost:8000/api/device/esp32-cam-01/ \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"lat":13.0827,"lon":80.2707}'

# Delete Device
curl -X DELETE http://localhost:8000/api/device/esp32-cam-01/ \
  -H "Authorization: Bearer <access_token>"

# Refresh Token
curl -X POST http://localhost:8000/api/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token>"}'
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

// Device location (update for your deployment)
const float deviceLat = 12.9716;
const float deviceLon = 77.5946;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = 5;
  config.pin_d1 = 18;
  config.pin_d2 = 19;
  config.pin_d3 = 21;
  config.pin_d4 = 36;
  config.pin_d5 = 39;
  config.pin_d6 = 34;
  config.pin_d7 = 35;
  config.pin_xclk = 0;
  config.pin_pclk = 22;
  config.pin_vsync = 25;
  config.pin_href = 23;
  config.pin_sscb_sda = 26;
  config.pin_sscb_scl = 27;
  config.pin_pwdn = 32;
  config.pin_reset = -1;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_VGA;
  config.jpeg_quality = 12;
  config.fb_count = 1;
  
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x\n", err);
    return;
  }
  
  // Register device on startup
  registerDevice();
}

void loop() {
  // Send heartbeat every 10 seconds
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 10000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
  
  // Check for motion (implement your motion sensor logic)
  if (motionDetected()) {
    captureAndSendImage();
  }
  
  delay(100);
}

void registerDevice() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(String(serverURL) + "/device/register/");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"device_id\":\"" + String(deviceId) + 
                   "\",\"lat\":" + String(deviceLat, 6) + 
                   ",\"lon\":" + String(deviceLon, 6) + "}";
  
  int httpCode = http.POST(payload);
  
  if (httpCode > 0) {
    Serial.println("Device registered: " + http.getString());
  } else {
    Serial.println("Registration failed: " + http.errorToString(httpCode));
  }
  
  http.end();
}

void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) return;
  
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

void captureAndSendImage() {
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  Serial.printf("Captured image: %d bytes\n", fb->len);
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(String(serverURL) + "/device/capture/");
    http.setTimeout(30000);  // 30 second timeout for upload
    
    // Create multipart form data
    String boundary = "----ESP32Boundary" + String(millis());
    
    String bodyStart = "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n";
    bodyStart += String(deviceId) + "\r\n";
    bodyStart += "--" + boundary + "\r\n";
    bodyStart += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
    bodyStart += "Content-Type: image/jpeg\r\n\r\n";
    
    String bodyEnd = "\r\n--" + boundary + "--\r\n";
    
    size_t totalLen = bodyStart.length() + fb->len + bodyEnd.length();
    
    uint8_t* payload = (uint8_t*)malloc(totalLen);
    if (!payload) {
      Serial.println("Memory allocation failed");
      esp_camera_fb_return(fb);
      return;
    }
    
    memcpy(payload, bodyStart.c_str(), bodyStart.length());
    memcpy(payload + bodyStart.length(), fb->buf, fb->len);
    memcpy(payload + bodyStart.length() + fb->len, bodyEnd.c_str(), bodyEnd.length());
    
    http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
    
    int httpCode = http.POST(payload, totalLen);
    
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("Classification result:");
      Serial.println(response);
      
      // Parse response for animal type
      // You can use ArduinoJson library for proper JSON parsing
      if (response.indexOf("\"animal_type\":\"Tiger\"") > 0 ||
          response.indexOf("\"animal_type\":\"Lion\"") > 0 ||
          response.indexOf("\"animal_type\":\"Leopard\"") > 0) {
        // Alert! Dangerous animal detected
        Serial.println("⚠️ DANGEROUS ANIMAL DETECTED!");
        // Trigger local alarm if available
      }
    } else {
      Serial.println("Upload failed: " + http.errorToString(httpCode));
    }
    
    free(payload);
    http.end();
  }
  
  esp_camera_fb_return(fb);
}

bool motionDetected() {
  // Implement motion detection logic
  // Could use PIR sensor, radar, or image-based motion detection
  return false;
}
```

---

## 9. API Summary Table

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/signup/` | ❌ | Register new user |
| `POST` | `/api/auth/login/` | ❌ | Login (username/email/mobile) |
| `POST` | `/api/auth/logout/` | ✅ | Logout (blacklist token) |
| `GET` | `/api/auth/profile/` | ✅ | Get user profile |
| `PUT` | `/api/auth/profile/` | ✅ | Update user profile |
| `GET` | `/api/user/devices/` | ✅ | List user's own devices |
| `POST` | `/api/user/devices/` | ✅ | Add device to account |
| `DELETE` | `/api/user/devices/?device_id=<id>` | ✅ | Remove device from account |
| `GET` | `/api/device/` | ✅ | List all devices |
| `GET` | `/api/device/?device_id=<id>` | ✅ | Get device by ID |
| `POST` | `/api/device/register/` | ❌ | Register ESP32 device |
| `PUT` | `/api/device/<device_id>/` | ✅ | Update device |
| `DELETE` | `/api/device/<device_id>/` | ✅ | Delete device |
| `POST` | `/api/device/message/` | ❌ | Send device heartbeat |
| `POST` | `/api/device/capture/` | ❌ | Upload image for classification |
| `GET` | `/api/images/` | ✅ | List captured images |
| `POST` | `/api/token/refresh/` | ❌ | Refresh access token |
| `GET` | `/api/test/` | ✅ | Test JWT authentication |

---

## 10. Workflow Diagrams

### ESP32 Device Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ESP32 Device Lifecycle                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. STARTUP                                                      │
│     ├── Connect to WiFi                                         │
│     └── POST /api/device/register/                              │
│         └── Response: { device_id, created_at }                 │
│                                                                  │
│  2. HEARTBEAT LOOP (every 10 seconds)                           │
│     └── POST /api/device/message/                               │
│         ├── Body: { device_id, message: "heartbeat" }           │
│         └── Response: { timestamp }                             │
│                                                                  │
│  3. MOTION DETECTED                                             │
│     ├── Capture image from camera                               │
│     └── POST /api/device/capture/                               │
│         ├── Body: multipart { device_id, image }                │
│         ├── Server runs YOLO inference                          │
│         ├── Server sends alerts (WhatsApp, calls)               │
│         └── Response: { animal_type, confidence, image_url }    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### User Dashboard Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dashboard User Flow                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AUTHENTICATION                                               │
│     ├── POST /api/auth/signup/ (new users)                      │
│     └── POST /api/auth/login/                                   │
│         └── Store tokens in localStorage                         │
│                                                                  │
│  2. SETUP PROFILE                                                │
│     └── PUT /api/auth/profile/                                  │
│         └── Set home_lat, home_lon for proximity alerts         │
│                                                                  │
│  3. DEVICE MANAGEMENT                                            │
│     ├── GET /api/user/devices/ - View my devices                │
│     ├── POST /api/user/devices/ - Add device                    │
│     └── DELETE /api/user/devices/?device_id=x - Remove device   │
│                                                                  │
│  4. VIEW DETECTIONS                                              │
│     └── GET /api/images/                                        │
│         ├── Rangers: See all detections                         │
│         ├── Device owners: See own device detections            │
│         └── Public: See recent alerts (24h, no locations)       │
│                                                                  │
│  5. REAL-TIME MONITORING                                         │
│     ├── GET /api/device/ - Device status/health                 │
│     └── GET /api/images/?device_id=x - Latest detections        │
│                                                                  │
│  6. LOGOUT                                                       │
│     └── POST /api/auth/logout/                                  │
│         └── Blacklist refresh token                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Alert System Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Wildlife Alert System                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  IMAGE CAPTURED → YOLO DETECTION                                │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────┐                        │
│  │  Animal Detected?                   │                        │
│  └──────────────┬──────────────────────┘                        │
│                 │                                                │
│        ┌───────┴───────┐                                        │
│        │ YES           │ NO                                     │
│        ▼               ▼                                        │
│  ┌─────────────┐  Return "no_detection"                         │
│  │ High Risk?  │                                                │
│  │ (Tiger,Lion,│                                                │
│  │ Leopard,    │                                                │
│  │ Human)      │                                                │
│  └──────┬──────┘                                                │
│         │                                                        │
│    ┌────┴────┐                                                  │
│    │YES      │NO (Medium/Low risk)                              │
│    ▼         ▼                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐               │
│  │ • WhatsApp to users │  │ • WhatsApp to users │               │
│  │   within 10km       │  │   within 10km       │               │
│  │ • Phone call to     │  └─────────────────────┘               │
│  │   device owner      │                                        │
│  └─────────────────────┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

**Version:** 2.0  
**Last Updated:** January 15, 2026  
**API Base:** `http://localhost:8000/api/`
