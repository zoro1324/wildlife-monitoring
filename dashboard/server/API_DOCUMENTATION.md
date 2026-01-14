# Wildlife Monitoring API Documentation

## Base URL
```
http://localhost:8000/api/
```

---

## Device Management Endpoints

### 1. List Devices

**Endpoint:** `GET /api/device/`

**Description:** Get list of all devices with their information.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
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
      "created_at": "2026-01-14T10:30:45.123456Z",
      "updated_at": "2026-01-14T10:30:45.123456Z"
    },
    {
      "id": 2,
      "device_id": "camera2",
      "lat": 12.9800,
      "lon": 77.6000,
      "owned_by": null,
      "owned_by_username": null,
      "created_at": "2026-01-14T10:35:20.987654Z",
      "updated_at": "2026-01-14T10:35:20.987654Z"
    }
  ]
}
```

**Example Usage:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8000/api/device/
```

---

### 2. Get Device by ID

**Endpoint:** `GET /api/device/?device_id=camera1`

**Description:** Get a specific device by device_id.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
```

**Query Parameters:**
- `device_id` (string) - Device identifier

**Success Response (200 OK):**
```json
{
  "id": 1,
  "device_id": "camera1",
  "lat": 12.9716,
  "lon": 77.5946,
  "owned_by": 1,
  "owned_by_username": "john_doe",
  "created_at": "2026-01-14T10:30:45.123456Z",
  "updated_at": "2026-01-14T10:30:45.123456Z"
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Device not found"
}
```

**Example Usage:**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/device/?device_id=camera1"
```

---

### 3. Edit Device

**Endpoint:** `PUT /api/device/<device_id>/`

**Description:** Edit device information (location, owner).

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "lat": 13.0827,
  "lon": 80.2707,
  "owned_by": 2
}
```

**Optional Fields:**
- `lat` (float) - New latitude
- `lon` (float) - New longitude
- `owned_by` (integer) - New owner user ID (null to remove owner)

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
    "created_at": "2026-01-14T10:30:45.123456Z",
    "updated_at": "2026-01-14T10:45:30.654321Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "error": "Device not found"
}
```

**Example Usage:**

```bash
curl -X PUT http://localhost:8000/api/device/camera1/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 13.0827,
    "lon": 80.2707,
    "owned_by": 2
  }'
```

---

### 4. Delete Device

**Endpoint:** `DELETE /api/device/<device_id>/delete/`

**Description:** Delete a device and all its associated messages.

**Authentication:** Required (JWT Token)

**Headers:**
```
Authorization: Bearer <your_jwt_access_token>
```

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
  "error": "Device not found"
}
```

**Example Usage:**

```bash
curl -X DELETE http://localhost:8000/api/device/camera1/delete/ \
  -H "Authorization: Bearer <token>"
```

---

### 5. Register Device (Store Device Information)

**Endpoint:** `POST /api/device/register/`

**Description:** Register or update IoT device information including location and ownership.

**Authentication:** Not required

**Request Body:**
```json
{
  "device_id": "camera1",
  "lat": 12.9716,
  "lon": 77.5946,
  "owned_by": 1
}
```

**Required Fields:**
- `device_id` (string) - Unique identifier for the device

**Optional Fields:**
- `lat` (float) - Latitude coordinate
- `lon` (float) - Longitude coordinate
- `owned_by` (integer) - User ID of the device owner

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
    "created_at": "2026-01-14T10:30:45.123456Z",
    "updated_at": "2026-01-14T10:30:45.123456Z"
  }
}
```

**Success Response (200 OK - Updated Device):**
```json
{
  "status": "success",
  "message": "Device updated",
  "device": {
    "id": 1,
    "device_id": "camera1",
    "lat": 12.9716,
    "lon": 77.5946,
    "owned_by": 1,
    "created_at": "2026-01-14T10:30:45.123456Z",
    "updated_at": "2026-01-14T10:35:20.987654Z"
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "device_id is required"
}
```

**Example Usage:**

```bash
# Register new device
curl -X POST http://localhost:8000/api/device/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id":"front_camera",
    "lat":12.9716,
    "lon":77.5946,
    "owned_by":1
  }'

# Update existing device location
curl -X POST http://localhost:8000/api/device/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id":"front_camera",
    "lat":12.9800,
    "lon":77.6000
  }'
```

---

### 2. Device Message (Connection Ping)

**Endpoint:** `POST /api/device/message/`

**Description:** Receive and store device connection messages/pings from ESP32. This is for checking connectivity and storing status updates.

**Authentication:** Not required

**Request Body:**
```json
{
  "device_id": "camera1",
  "message": "temperature:25,humidity:60,status:ok"
}
```

**Required Fields:**
- `device_id` (string) - Device identifier
- `message` (string) - Connection message or status data

**Success Response (201 Created):**
```json
{
  "status": "success",
  "message": "Device message stored",
  "device_id": "camera1",
  "timestamp": "2026-01-14T10:30:45.123456Z"
}
```

**Error Response (400 Bad Request):**
```json
{
  "error": "device_id and message are required"
}
```

**Example Usage:**

```bash
curl -X POST http://localhost:8000/api/device/message/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id":"camera1",
    "message":"status:online,battery:85%,signal:good"
  }'
```

**Notes:**
- If device doesn't exist, it will be created automatically
- This endpoint is for connection/status messages only
- Use `/device/register/` for device information updates

---

## ESP32 Integration

### Complete ESP32 Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* serverUrl = "http://192.168.1.100:8000/api";

TinyGPSPlus gps;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
  
  // Register device once on startup
  registerDevice();
}

void loop() {
  // Send connection ping every 10 seconds
  sendConnectionPing();
  delay(10000);
}

// Register device with location info (called once)
void registerDevice() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(String(serverUrl) + "/device/register/");
    http.addHeader("Content-Type", "application/json");
    
    float lat = gps.location.lat();
    float lon = gps.location.lng();
    
    StaticJsonDocument<300> doc;
    doc["device_id"] = "esp32_cam_001";
    
    if (gps.location.isValid()) {
      doc["lat"] = lat;
      doc["lon"] = lon;
    }
    
    doc["owned_by"] = 1;  // Optional: User ID
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      Serial.println("Device registered: " + http.getString());
    }
    
    http.end();
  }
}

// Send connection ping (called periodically)
void sendConnectionPing() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(String(serverUrl) + "/device/message/");
    http.addHeader("Content-Type", "application/json");
    
    StaticJsonDocument<200> doc;
    doc["device_id"] = "esp32_cam_001";
    doc["message"] = "temp:" + String(random(20, 30)) + ",status:active";
    
    String jsonData;
    serializeJson(doc, jsonData);
    
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      Serial.println("Ping sent: " + http.getString());
    }
    
    http.end();
  }
}
```

---

## Database Schema

### Device Model (Device Information)
```
id (Primary Key) - Auto-generated
device_id (String, Unique) - Device identifier
lat (Float, Optional) - Latitude
lon (Float, Optional) - Longitude
owned_by (Foreign Key to User, Optional) - Device owner
created_at (DateTime) - Creation timestamp
updated_at (DateTime) - Last update timestamp
```

### DeviceMessage Model (Connection Messages)
```
id (Primary Key) - Auto-generated
device (Foreign Key to Device) - Associated device
message (Text) - Message content
timestamp (DateTime) - Message timestamp
```

**Relationships:**
- DeviceMessage → Device (CASCADE on delete)
- Device → User (SET_NULL on delete)

---

## Summary

**Two Separate Tables:**

1. **Device** (`/api/device/register/`)
   - Stores: device_id, lat, lon, owned_by
   - Used for: Device information
   - Called: Once on setup or when info changes

2. **DeviceMessage** (`/api/device/message/`)
   - Stores: device reference, message, timestamp
   - Used for: Connection pings/status checks
   - Called: Periodically (every 10 seconds)
