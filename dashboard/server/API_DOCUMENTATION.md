# Wildlife Monitoring System - API Documentation

**Version:** 1.0.0  
**Base URL:** `http://localhost:8000/api/`  
**Date:** January 12, 2026

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication-endpoints)
  - [Devices](#device-endpoints)
  - [Images](#image-endpoints)
  - [Detections](#detection-endpoints)
  - [Alerts](#alert-endpoints)
  - [Dashboard](#dashboard-endpoints)
- [Data Models](#data-models)
- [Examples](#examples)

---

## Overview

The Wildlife Monitoring System API provides RESTful endpoints for managing IoT devices (ESP32-CAM), processing captured images, detecting animals using AI, and managing alerts for farmers.

### Key Features

- **JWT Authentication** for users (farmers/admins)
- **Device Token Authentication** for IoT devices
- **Real-time image processing** with YOLO AI detection
- **Multi-level threat assessment** (low, medium, high)
- **Automated alert generation** for dangerous animals
- **Comprehensive dashboard** with statistics and trends

---

## Authentication

### User Authentication (JWT)

Used by farmers and administrators to access the dashboard and manage devices.

**Headers:**
```http
Authorization: Bearer <access_token>
```

**Token Endpoints:**
- `POST /api/auth/login/` - Obtain access and refresh tokens
- `POST /api/auth/refresh/` - Refresh access token
- `POST /api/auth/logout/` - Blacklist refresh token

**Token Lifetime:**
- Access Token: 30 minutes
- Refresh Token: 7 days

### Device Authentication (Token)

Used by ESP32-CAM devices to upload images and send heartbeats.

**Headers (Option 1):**
```http
Authorization: Device <device_token>
```

**Headers (Option 2):**
```http
X-Device-Token: <device_token>
```

**How to Get Device Token:**
1. Register device via user account: `POST /api/devices/`
2. Retrieve token: `GET /api/devices/{id}/token/`
3. Use token in all device requests

---

## Rate Limiting

### Rate Limits by User Type

| User Type | Rate Limit | Scope |
|-----------|------------|-------|
| Anonymous | 100/hour | All requests |
| Authenticated User | 1000/hour | All requests |
| IoT Device | 500/hour | All requests |
| Image Upload | 60/hour | Upload endpoint only |
| Burst | 30/minute | All endpoints |

### Rate Limit Headers

Response includes rate limit information:
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1642000000
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Request rate limit exceeded. Try again in 3600 seconds.",
    "details": {}
  }
}
```

---

## Error Handling

### Standard Error Response Format

All errors follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {
      "field_name": ["Specific field error"]
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `AUTHENTICATION_FAILED` | 401 | Invalid credentials |
| `NOT_AUTHENTICATED` | 401 | Missing authentication |
| `PERMISSION_DENIED` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVER_ERROR` | 500 | Internal server error |

---

## API Endpoints

## Authentication Endpoints

### Register User

Register a new farmer/admin account.

**Endpoint:** `POST /api/auth/register/`  
**Authentication:** None  
**Rate Limit:** Anonymous

**Request Body:**
```json
{
  "username": "farmer_john",
  "email": "john@farm.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "farmer_john",
      "email": "john@farm.com",
      "first_name": "John",
      "last_name": "Doe",
      "date_joined": "2026-01-12T10:00:00Z"
    },
    "tokens": {
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
      "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
    }
  }
}
```

---

### Login

Obtain JWT tokens for authentication.

**Endpoint:** `POST /api/auth/login/`  
**Authentication:** None  
**Rate Limit:** Anonymous

**Request Body:**
```json
{
  "username": "farmer_john",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Refresh Token

Get a new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh/`  
**Authentication:** None  
**Rate Limit:** Anonymous

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

---

### Logout

Blacklist the refresh token.

**Endpoint:** `POST /api/auth/logout/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### Get User Profile

Retrieve authenticated user's profile.

**Endpoint:** `GET /api/auth/profile/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "farmer_john",
  "email": "john@farm.com",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2026-01-12T10:00:00Z"
}
```

---

### Update User Profile

Update user profile information.

**Endpoint:** `PATCH /api/auth/profile/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "first_name": "Jonathan",
  "email": "jonathan@farm.com"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "farmer_john",
  "email": "jonathan@farm.com",
  "first_name": "Jonathan",
  "last_name": "Doe",
  "date_joined": "2026-01-12T10:00:00Z"
}
```

---

### Change Password

Change user password.

**Endpoint:** `POST /api/auth/change-password/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "old_password": "SecurePass123!",
  "new_password": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## Device Endpoints

### List Devices

Get all devices owned by the authenticated user.

**Endpoint:** `GET /api/devices/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `status` - Filter by status (active, offline, maintenance)
- `page` - Page number (default: 1)
- `page_size` - Items per page (default: 20)

**Response (200 OK):**
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "device_id": "ESP32-CAM-001",
      "owner": {
        "id": 1,
        "username": "farmer_john",
        "email": "john@farm.com",
        "first_name": "John",
        "last_name": "Doe",
        "date_joined": "2026-01-12T10:00:00Z"
      },
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "active",
      "status_display": "Active",
      "last_seen": "2026-01-12T15:30:00Z",
      "created": "2026-01-10T08:00:00Z",
      "image_count": 156
    }
  ]
}
```

---

### Register Device

Register a new IoT device.

**Endpoint:** `POST /api/devices/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "device_id": "ESP32-CAM-002",
  "latitude": 40.7589,
  "longitude": -73.9851,
  "status": "active"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "id": 2,
    "device_id": "ESP32-CAM-002",
    "latitude": 40.7589,
    "longitude": -73.9851,
    "status": "active",
    "token": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2"
  }
}
```

---

### Get Device Details

Get details of a specific device.

**Endpoint:** `GET /api/devices/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (200 OK):**
```json
{
  "id": 1,
  "device_id": "ESP32-CAM-001",
  "owner": {
    "id": 1,
    "username": "farmer_john",
    "email": "john@farm.com",
    "first_name": "John",
    "last_name": "Doe",
    "date_joined": "2026-01-12T10:00:00Z"
  },
  "latitude": 40.7128,
  "longitude": -74.0060,
  "status": "active",
  "status_display": "Active",
  "last_seen": "2026-01-12T15:30:00Z",
  "created": "2026-01-10T08:00:00Z",
  "image_count": 156
}
```

---

### Update Device

Update device information.

**Endpoint:** `PATCH /api/devices/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Request Body:**
```json
{
  "latitude": 40.7200,
  "longitude": -74.0100,
  "status": "maintenance"
}
```

**Response (200 OK):**
```json
{
  "id": 1,
  "device_id": "ESP32-CAM-001",
  "owner": {...},
  "latitude": 40.7200,
  "longitude": -74.0100,
  "status": "maintenance",
  "status_display": "Maintenance",
  "last_seen": "2026-01-12T15:30:00Z",
  "created": "2026-01-10T08:00:00Z",
  "image_count": 156
}
```

---

### Delete Device

Delete a device and all its associated data.

**Endpoint:** `DELETE /api/devices/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (204 No Content)**

---

### Get Device Token

Retrieve authentication token for a device.

**Endpoint:** `GET /api/devices/{id}/token/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "key": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "created": "2026-01-10T08:00:00Z",
    "last_used": "2026-01-12T15:25:00Z",
    "is_active": true
  }
}
```

---

### Regenerate Device Token

Generate a new authentication token (invalidates old token).

**Endpoint:** `POST /api/devices/{id}/regenerate-token/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token regenerated successfully",
  "data": {
    "token": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8"
  }
}
```

---

### Device Heartbeat

Send health status from device to server.

**Endpoint:** `POST /api/devices/heartbeat/`  
**Authentication:** Required (Device Token)  
**Rate Limit:** Device

**Request Body:**
```json
{
  "battery_level": 85,
  "signal_strength": -45,
  "temperature": 28.5
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Heartbeat received",
  "data": {
    "device_id": "ESP32-CAM-001",
    "status": "active",
    "server_time": "2026-01-12T15:30:00Z"
  }
}
```

---

### Get Device Images

Get recent images from a specific device.

**Endpoint:** `GET /api/devices/{id}/images/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "device_id": "ESP32-CAM-001",
      "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
      "captured": "2026-01-12T15:25:00Z",
      "source": "motion",
      "processed": true,
      "animal_detected": true,
      "primary_animal": "Tiger",
      "max_confidence": 0.92,
      "threat_level": "high",
      "detection_count": 1
    }
  ]
}
```

---

## Image Endpoints

### List Images

Get all images from user's devices.

**Endpoint:** `GET /api/images/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `device` - Filter by device_id
- `processed` - Filter by processed status (true/false)
- `threat_level` - Filter by threat level (low, medium, high)
- `start_date` - Filter by date (YYYY-MM-DD)
- `end_date` - Filter by date (YYYY-MM-DD)
- `page` - Page number
- `page_size` - Items per page

**Response (200 OK):**
```json
{
  "count": 156,
  "next": "http://localhost:8000/api/images/?page=2",
  "previous": null,
  "results": [
    {
      "id": 101,
      "device_id": "ESP32-CAM-001",
      "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
      "captured": "2026-01-12T15:25:00Z",
      "source": "motion",
      "processed": true,
      "animal_detected": true,
      "primary_animal": "Tiger",
      "max_confidence": 0.92,
      "threat_level": "high",
      "detection_count": 1
    }
  ]
}
```

---

### Get Image Details

Get detailed information about an image including all detections.

**Endpoint:** `GET /api/images/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be device owner

**Response (200 OK):**
```json
{
  "id": 101,
  "device": {
    "id": 1,
    "device_id": "ESP32-CAM-001",
    "owner": {...},
    "latitude": 40.7128,
    "longitude": -74.0060,
    "status": "active",
    "status_display": "Active",
    "last_seen": "2026-01-12T15:30:00Z",
    "created": "2026-01-10T08:00:00Z",
    "image_count": 156
  },
  "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
  "captured": "2026-01-12T15:25:00Z",
  "source": "motion",
  "processed": true,
  "animal_detected": true,
  "primary_animal": "Tiger",
  "max_confidence": 0.92,
  "threat_level": "high",
  "created": "2026-01-12T15:25:10Z",
  "detections": [
    {
      "id": 201,
      "animal_type": "Tiger",
      "confidence": 0.92,
      "bounding_box": {
        "x_min": 0.25,
        "y_min": 0.30,
        "x_max": 0.75,
        "y_max": 0.80
      },
      "threat_level": "high",
      "threat_level_display": "High",
      "detected_at": "2026-01-12T15:25:15Z"
    }
  ]
}
```

---

### Upload Image (Device)

Upload an image from ESP32-CAM device.

**Endpoint:** `POST /api/images/upload/`  
**Authentication:** Required (Device Token)  
**Rate Limit:** Device + Image Upload  
**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
```
image: [Binary File]
source: motion
captured: 2026-01-12T15:25:00Z  (optional, defaults to server time)
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Image uploaded successfully and queued for processing",
  "data": {
    "image_id": 102,
    "status": "processing"
  }
}
```

---

### Request Manual Capture

Request an immediate snapshot from a device.

**Endpoint:** `POST /api/images/capture/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "device_id": "ESP32-CAM-001"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Capture request sent to device",
  "data": {
    "device_id": "ESP32-CAM-001",
    "request_time": "2026-01-12T15:30:00Z"
  }
}
```

---

## Detection Endpoints

### List Detections

Get all animal detections.

**Endpoint:** `GET /api/detections/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `animal_type` - Filter by animal type
- `threat_level` - Filter by threat level (low, medium, high)
- `min_confidence` - Minimum confidence score (0.0-1.0)
- `page` - Page number
- `page_size` - Items per page

**Response (200 OK):**
```json
{
  "count": 324,
  "next": "http://localhost:8000/api/detections/?page=2",
  "previous": null,
  "results": [
    {
      "id": 201,
      "animal_type": "Tiger",
      "confidence": 0.92,
      "bounding_box": {
        "x_min": 0.25,
        "y_min": 0.30,
        "x_max": 0.75,
        "y_max": 0.80
      },
      "threat_level": "high",
      "threat_level_display": "High",
      "detected_at": "2026-01-12T15:25:15Z"
    }
  ]
}
```

---

### Get Detection Details

Get details of a specific detection.

**Endpoint:** `GET /api/detections/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Response (200 OK):**
```json
{
  "id": 201,
  "animal_type": "Tiger",
  "confidence": 0.92,
  "bounding_box": {
    "x_min": 0.25,
    "y_min": 0.30,
    "x_max": 0.75,
    "y_max": 0.80
  },
  "threat_level": "high",
  "threat_level_display": "High",
  "detected_at": "2026-01-12T15:25:15Z"
}
```

---

### Detection Summary

Get statistics grouped by animal type.

**Endpoint:** `GET /api/detections/summary/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `days` - Number of days to look back (default: 30)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "animal_type": "Tiger",
      "count": 15,
      "avg_confidence": 0.89
    },
    {
      "animal_type": "Leopard",
      "count": 8,
      "avg_confidence": 0.85
    },
    {
      "animal_type": "Elephant",
      "count": 42,
      "avg_confidence": 0.91
    }
  ]
}
```

---

## Alert Endpoints

### List Alerts

Get all alerts for the authenticated user.

**Endpoint:** `GET /api/alerts/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `read` - Filter by read status (true/false)
- `alert_type` - Filter by type (high_threat, repeated_detection, unusual_activity)
- `page` - Page number
- `page_size` - Items per page

**Response (200 OK):**
```json
{
  "count": 23,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 301,
      "alert_type": "high_threat",
      "alert_type_display": "High Threat Animal",
      "message": "⚠️ High threat detected: Tiger detected near device ESP32-CAM-001 with 92% confidence.",
      "read": false,
      "created": "2026-01-12T15:25:20Z",
      "image_url": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
      "device_id": "ESP32-CAM-001"
    }
  ]
}
```

---

### Get Alert Details

Get detailed information about an alert.

**Endpoint:** `GET /api/alerts/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be alert recipient

**Response (200 OK):**
```json
{
  "id": 301,
  "alert_type": "high_threat",
  "alert_type_display": "High Threat Animal",
  "message": "⚠️ High threat detected: Tiger detected near device ESP32-CAM-001 with 92% confidence.",
  "read": false,
  "created": "2026-01-12T15:25:20Z",
  "image_url": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
  "device_id": "ESP32-CAM-001",
  "image": {
    "id": 101,
    "device": {...},
    "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
    "captured": "2026-01-12T15:25:00Z",
    "source": "motion",
    "processed": true,
    "animal_detected": true,
    "primary_animal": "Tiger",
    "max_confidence": 0.92,
    "threat_level": "high",
    "created": "2026-01-12T15:25:10Z",
    "detections": [...]
  }
}
```

---

### Update Alert

Update alert (typically to mark as read).

**Endpoint:** `PATCH /api/alerts/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be alert recipient

**Request Body:**
```json
{
  "read": true
}
```

**Response (200 OK):**
```json
{
  "id": 301,
  "alert_type": "high_threat",
  "alert_type_display": "High Threat Animal",
  "message": "⚠️ High threat detected: Tiger detected near device ESP32-CAM-001 with 92% confidence.",
  "read": true,
  "created": "2026-01-12T15:25:20Z",
  "image_url": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
  "device_id": "ESP32-CAM-001"
}
```

---

### Mark Alerts as Read

Mark one or multiple alerts as read.

**Endpoint:** `POST /api/alerts/mark_read/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Request Body:**
```json
{
  "alert_ids": [301, 302, 303]
}
```

**Request Body (Mark all as read):**
```json
{
  "alert_ids": []
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "3 alerts marked as read"
}
```

---

### Get Unread Alert Count

Get count of unread alerts.

**Endpoint:** `GET /api/alerts/unread_count/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "unread_count": 5
  }
}
```

---

### Delete Alert

Delete an alert.

**Endpoint:** `DELETE /api/alerts/{id}/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User  
**Permissions:** Must be alert recipient

**Response (204 No Content)**

---

## Dashboard Endpoints

### Dashboard Statistics

Get comprehensive statistics for the dashboard.

**Endpoint:** `GET /api/dashboard/stats/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "total_devices": 5,
    "active_devices": 4,
    "offline_devices": 1,
    "total_images": 1543,
    "images_today": 87,
    "total_detections": 324,
    "detections_today": 23,
    "unread_alerts": 5,
    "high_threat_alerts": 2
  }
}
```

---

### Recent Activity

Get recent activity feed.

**Endpoint:** `GET /api/dashboard/activity/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `limit` - Number of activities to return (default: 20)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "activity_type": "detection",
      "message": "Tiger detected with 92% confidence",
      "timestamp": "2026-01-12T15:25:15Z",
      "device_id": "ESP32-CAM-001",
      "image_id": 101,
      "threat_level": "high"
    },
    {
      "activity_type": "alert",
      "message": "⚠️ High threat detected: Tiger detected near device ESP32-CAM-001 with 92% confidence.",
      "timestamp": "2026-01-12T15:25:20Z",
      "device_id": "ESP32-CAM-001",
      "image_id": 101,
      "threat_level": "high"
    }
  ]
}
```

---

### Device Map Data

Get device locations for map visualization.

**Endpoint:** `GET /api/dashboard/map/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "device_id": "ESP32-CAM-001",
      "latitude": 40.7128,
      "longitude": -74.0060,
      "status": "active",
      "last_seen": "2026-01-12T15:30:00Z",
      "detection_count": 65,
      "alert_count": 8
    },
    {
      "device_id": "ESP32-CAM-002",
      "latitude": 40.7589,
      "longitude": -73.9851,
      "status": "active",
      "last_seen": "2026-01-12T15:28:00Z",
      "detection_count": 42,
      "alert_count": 3
    }
  ]
}
```

---

### Detection Trends

Get detection trends for charts.

**Endpoint:** `GET /api/dashboard/trends/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `days` - Number of days to look back (default: 7)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "daily_counts": [
      {"date": "2026-01-06", "count": 15},
      {"date": "2026-01-07", "count": 22},
      {"date": "2026-01-08", "count": 18},
      {"date": "2026-01-09", "count": 25},
      {"date": "2026-01-10", "count": 31},
      {"date": "2026-01-11", "count": 28},
      {"date": "2026-01-12", "count": 23}
    ],
    "by_animal": [
      {"animal_type": "Elephant", "count": 42},
      {"animal_type": "Tiger", "count": 15},
      {"animal_type": "Boar", "count": 28},
      {"animal_type": "Leopard", "count": 8}
    ],
    "by_threat": [
      {"threat_level": "low", "count": 65},
      {"threat_level": "medium", "count": 35},
      {"threat_level": "high", "count": 23}
    ]
  }
}
```

---

### Live Feed

Get recent images for live feed display.

**Endpoint:** `GET /api/dashboard/live/`  
**Authentication:** Required (JWT)  
**Rate Limit:** User

**Query Parameters:**
- `device` - Filter by device_id (optional)
- `limit` - Number of images (default: 10)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "device_id": "ESP32-CAM-001",
      "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
      "captured": "2026-01-12T15:25:00Z",
      "source": "motion",
      "processed": true,
      "animal_detected": true,
      "primary_animal": "Tiger",
      "max_confidence": 0.92,
      "threat_level": "high",
      "detection_count": 1
    }
  ]
}
```

---

## Data Models

### IoTDevice Model

```json
{
  "id": 1,
  "device_id": "ESP32-CAM-001",
  "owner": {
    "id": 1,
    "username": "farmer_john",
    "email": "john@farm.com",
    "first_name": "John",
    "last_name": "Doe",
    "date_joined": "2026-01-12T10:00:00Z"
  },
  "latitude": 40.7128,
  "longitude": -74.0060,
  "status": "active",
  "status_display": "Active",
  "last_seen": "2026-01-12T15:30:00Z",
  "created": "2026-01-10T08:00:00Z",
  "image_count": 156
}
```

**Status Values:**
- `active` - Device is operational
- `offline` - Device hasn't communicated recently
- `maintenance` - Device under maintenance

---

### Image Model

```json
{
  "id": 101,
  "device_id": "ESP32-CAM-001",
  "image": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
  "captured": "2026-01-12T15:25:00Z",
  "source": "motion",
  "processed": true,
  "animal_detected": true,
  "primary_animal": "Tiger",
  "max_confidence": 0.92,
  "threat_level": "high",
  "detection_count": 1
}
```

**Source Values:**
- `motion` - Captured by motion detection
- `manual` - Manually requested capture
- `live` - Live stream snapshot

**Threat Level Values:**
- `low` - No threat or harmless animals
- `medium` - Potentially dangerous (Elephant, Boar, Bison)
- `high` - Dangerous predators (Lion, Tiger, Leopard, Bear)

---

### AnimalDetection Model

```json
{
  "id": 201,
  "animal_type": "Tiger",
  "confidence": 0.92,
  "bounding_box": {
    "x_min": 0.25,
    "y_min": 0.30,
    "x_max": 0.75,
    "y_max": 0.80
  },
  "threat_level": "high",
  "threat_level_display": "High",
  "detected_at": "2026-01-12T15:25:15Z"
}
```

**Bounding Box:** Normalized coordinates (0.0-1.0)
- `x_min`, `y_min` - Top-left corner
- `x_max`, `y_max` - Bottom-right corner

**Supported Animals:**
- Bear, Bison, Boar, Elephant, Human, Leopard, Lion, Tiger

---

### Alert Model

```json
{
  "id": 301,
  "alert_type": "high_threat",
  "alert_type_display": "High Threat Animal",
  "message": "⚠️ High threat detected: Tiger detected near device ESP32-CAM-001 with 92% confidence.",
  "read": false,
  "created": "2026-01-12T15:25:20Z",
  "image_url": "http://localhost:8000/media/captures/2026/01/12/image_001.jpg",
  "device_id": "ESP32-CAM-001"
}
```

**Alert Types:**
- `high_threat` - Dangerous animal detected
- `repeated_detection` - Same animal detected multiple times
- `unusual_activity` - Unusual patterns detected

---

## Examples

### Example 1: Complete User Registration & Device Setup Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "farmer_john",
    "email": "john@farm.com",
    "password": "SecurePass123!",
    "password_confirm": "SecurePass123!",
    "first_name": "John",
    "last_name": "Doe"
  }'

# Response includes access token
# Save the access token for subsequent requests

# 2. Register a new device
curl -X POST http://localhost:8000/api/devices/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32-CAM-001",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "status": "active"
  }'

# Response includes device token
# Save the device token for ESP32-CAM

# 3. Configure ESP32-CAM with device token
# Store token on device: "a1b2c3d4e5f6g7h8..."
```

---

### Example 2: ESP32-CAM Image Upload

```bash
# Send heartbeat every 5 minutes
curl -X POST http://localhost:8000/api/devices/heartbeat/ \
  -H "Authorization: Device YOUR_DEVICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "battery_level": 85,
    "signal_strength": -45
  }'

# Upload image when motion detected
curl -X POST http://localhost:8000/api/images/upload/ \
  -H "Authorization: Device YOUR_DEVICE_TOKEN" \
  -F "image=@/path/to/captured_image.jpg" \
  -F "source=motion" \
  -F "captured=2026-01-12T15:25:00Z"

# Image is automatically queued for AI processing
# Alert is generated if high-threat animal detected
```

---

### Example 3: Dashboard Data Fetching

```bash
# Get dashboard statistics
curl -X GET http://localhost:8000/api/dashboard/stats/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get recent activity
curl -X GET http://localhost:8000/api/dashboard/activity/?limit=10 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get device locations for map
curl -X GET http://localhost:8000/api/dashboard/map/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get detection trends (last 7 days)
curl -X GET http://localhost:8000/api/dashboard/trends/?days=7 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get unread alerts
curl -X GET "http://localhost:8000/api/alerts/?read=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Example 4: Filtering and Pagination

```bash
# Get high-threat images from specific device
curl -X GET "http://localhost:8000/api/images/?device=ESP32-CAM-001&threat_level=high" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get tiger detections with high confidence
curl -X GET "http://localhost:8000/api/detections/?animal_type=Tiger&min_confidence=0.8" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get images from date range
curl -X GET "http://localhost:8000/api/images/?start_date=2026-01-01&end_date=2026-01-12" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Pagination
curl -X GET "http://localhost:8000/api/images/?page=2&page_size=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Example 5: Alert Management

```bash
# Get unread alerts
curl -X GET "http://localhost:8000/api/alerts/?read=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Mark specific alerts as read
curl -X POST http://localhost:8000/api/alerts/mark_read/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_ids": [301, 302, 303]
  }'

# Mark all alerts as read
curl -X POST http://localhost:8000/api/alerts/mark_read/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_ids": []
  }'

# Delete an alert
curl -X DELETE http://localhost:8000/api/alerts/301/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

### Example 6: Python SDK Usage

```python
import requests

class WildlifeMonitoringAPI:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.access_token = None
        self.refresh_token = None
        self.login(username, password)
    
    def login(self, username, password):
        """Login and store tokens"""
        response = requests.post(
            f"{self.base_url}/auth/login/",
            json={"username": username, "password": password}
        )
        data = response.json()
        self.access_token = data['access']
        self.refresh_token = data['refresh']
    
    def get_headers(self):
        """Get authorization headers"""
        return {"Authorization": f"Bearer {self.access_token}"}
    
    def get_dashboard_stats(self):
        """Get dashboard statistics"""
        response = requests.get(
            f"{self.base_url}/dashboard/stats/",
            headers=self.get_headers()
        )
        return response.json()
    
    def get_devices(self):
        """Get all devices"""
        response = requests.get(
            f"{self.base_url}/devices/",
            headers=self.get_headers()
        )
        return response.json()
    
    def get_unread_alerts(self):
        """Get unread alerts"""
        response = requests.get(
            f"{self.base_url}/alerts/?read=false",
            headers=self.get_headers()
        )
        return response.json()

# Usage
api = WildlifeMonitoringAPI(
    "http://localhost:8000/api",
    "farmer_john",
    "SecurePass123!"
)

# Get dashboard data
stats = api.get_dashboard_stats()
print(f"Total devices: {stats['data']['total_devices']}")
print(f"Unread alerts: {stats['data']['unread_alerts']}")

# Get devices
devices = api.get_devices()
for device in devices['results']:
    print(f"Device: {device['device_id']} - Status: {device['status']}")

# Get unread alerts
alerts = api.get_unread_alerts()
print(f"You have {len(alerts['results'])} unread alerts")
```

---

### Example 7: Arduino/ESP32 Integration

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include "esp_camera.h"

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://YOUR_SERVER_IP:8000/api";
const char* deviceToken = "YOUR_DEVICE_TOKEN_HERE";

void uploadImage() {
    camera_fb_t *fb = esp_camera_fb_get();
    
    if (!fb) {
        Serial.println("Camera capture failed");
        return;
    }
    
    HTTPClient http;
    http.begin(String(serverUrl) + "/images/upload/");
    http.addHeader("Authorization", String("Device ") + deviceToken);
    
    String boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    String contentType = "multipart/form-data; boundary=" + boundary;
    http.addHeader("Content-Type", contentType);
    
    String body = "--" + boundary + "\r\n";
    body += "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n";
    body += "Content-Type: image/jpeg\r\n\r\n";
    
    // Add image data
    uint8_t* buffer = (uint8_t*)malloc(body.length() + fb->len + 50);
    memcpy(buffer, body.c_str(), body.length());
    memcpy(buffer + body.length(), fb->buf, fb->len);
    
    String footer = "\r\n--" + boundary + "\r\n";
    footer += "Content-Disposition: form-data; name=\"source\"\r\n\r\n";
    footer += "motion\r\n";
    footer += "--" + boundary + "--\r\n";
    
    memcpy(buffer + body.length() + fb->len, footer.c_str(), footer.length());
    
    int httpCode = http.POST(buffer, body.length() + fb->len + footer.length());
    
    if (httpCode == 201) {
        Serial.println("Image uploaded successfully");
    } else {
        Serial.printf("Upload failed, code: %d\n", httpCode);
    }
    
    free(buffer);
    esp_camera_fb_return(fb);
    http.end();
}

void sendHeartbeat() {
    HTTPClient http;
    http.begin(String(serverUrl) + "/devices/heartbeat/");
    http.addHeader("Authorization", String("Device ") + deviceToken);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"battery_level\": 85, \"signal_strength\": -45}";
    
    int httpCode = http.POST(payload);
    
    if (httpCode == 200) {
        Serial.println("Heartbeat sent");
    }
    
    http.end();
}

void setup() {
    Serial.begin(115200);
    
    // Initialize WiFi
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi...");
    }
    
    // Initialize camera
    // ... camera initialization code ...
}

void loop() {
    // Send heartbeat every 5 minutes
    static unsigned long lastHeartbeat = 0;
    if (millis() - lastHeartbeat > 300000) {
        sendHeartbeat();
        lastHeartbeat = millis();
    }
    
    // Check for motion and upload image
    if (motionDetected()) {
        uploadImage();
    }
    
    delay(100);
}
```

---

## Best Practices

### Security

1. **Never expose device tokens** - Store securely on devices
2. **Use HTTPS in production** - Encrypt all traffic
3. **Rotate tokens regularly** - Use regenerate-token endpoint
4. **Validate all inputs** - API handles validation but double-check
5. **Monitor failed authentication** - Implement logging/alerting

### Performance

1. **Use pagination** - Don't fetch all records at once
2. **Filter queries** - Use query parameters to reduce data
3. **Cache dashboard data** - Refresh every 30-60 seconds
4. **Optimize image uploads** - Compress images before upload
5. **Batch operations** - Use mark_read for multiple alerts

### Device Integration

1. **Implement retry logic** - Handle network failures
2. **Queue uploads locally** - Upload when connection available
3. **Send heartbeats regularly** - Every 5 minutes recommended
4. **Handle 429 errors** - Implement exponential backoff
5. **Monitor battery** - Reduce frequency when low

---

## Support & Contact

For issues, questions, or contributions:
- **GitHub:** https://github.com/zoro1324/wildlife-monitoring
- **Email:** support@wildlife-monitoring.com
- **Documentation:** http://localhost:8000/api/docs/ (if enabled)

---

**Last Updated:** January 12, 2026  
**API Version:** 1.0.0
