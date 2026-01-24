# ESP32-CAM PIR Motion Upload

Capture a JPEG only on PIR motion and POST to your Django server `/api/device/capture/` endpoint.

## Wiring
- Board: AI Thinker ESP32-CAM
- PIR sensor VCC → 5V (check your PIR, many support 5V; use 3.3V if required)
- PIR sensor GND → GND
- PIR sensor OUT → GPIO 13 on ESP32-CAM
  - Note: GPIO 13 often drives the flash LED on ESP32-CAM; if you use the flash, pick another pin (e.g., GPIO 14) and update `PIR_PIN`.

## Configure
Edit `ESP32CamPirMotion.ino`:
- `WIFI_SSID`, `WIFI_PASSWORD`
- `SERVER_HOST`, `SERVER_PORT` (e.g., 10.76.24.170:8000)
- `ENDPOINT` (should be `/api/device/capture/`)
- `DEVICE_ID` (e.g., `ESP32_CAM_001`)

Ensure your server allows the ESP32 host in `ALLOWED_HOSTS` and is running:

```bash
python manage.py runserver 0.0.0.0:8000
```

## Build & Flash
- Arduino IDE: select `AI Thinker ESP32-CAM`, enable PSRAM
- Install `esp32` board support via Boards Manager
- Connect USB-to-serial to ESP32-CAM (IO0 to GND for flashing), press reset, upload

## Server Expectations
- Endpoint: `POST /api/device/capture/`
- Content-Type: `multipart/form-data`
- Fields:
  - `device_id`: string
  - `image`: JPEG file (<= 10MB)

Response examples:
- Success (201): JSON with `status: success`, image URLs
- No detection (200): `status: no_detection`

## Notes
- Motion is throttled by `MIN_UPLOAD_INTERVAL_MS` to avoid spamming
- If interrupts are unstable, polling backup triggers when PIR stays HIGH
- If you see `DisallowedHost`, add your server IP to `ALLOWED_HOSTS` in `.env`
