// ESP32-CAM + PIR motion: capture and upload only on motion
// Board: AI Thinker ESP32-CAM (with PSRAM)
// PIR motion input: GPIO 13 (note: this pin often drives the flash LED on ESP32-CAM)
// Server endpoint: POST /api/device/capture/ (multipart/form-data: device_id + image)

#include <WiFi.h>
#include <WiFiClient.h>
#include "esp_camera.h"

// ====== CONFIGURE THESE ======
const char* WIFI_SSID     = "zoro";
const char* WIFI_PASSWORD = "1234567890";

const char* SERVER_HOST = "10.76.24.170"; // your Django server IP
const uint16_t SERVER_PORT = 8000;         // Django dev port
const char* ENDPOINT = "/api/device/capture/";
const char* DEVICE_ID = "ESP32-CAM-109";

// PIR input pin
#define PIR_PIN 13

// Buzzer output pin (active buzzer)
#define BUZZER_PIN 14

// Rate limit: minimum time between uploads (ms)
const unsigned long MIN_UPLOAD_INTERVAL_MS = 10000; // 10 seconds

// Time window for human crossing after dangerous animal (ms)
const unsigned long DANGEROUS_WINDOW_MS = 60UL * 60UL * 1000UL; // 60 minutes

// Camera model pins (AI Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

volatile bool motion_flag = false;
unsigned long last_upload_ms = 0;
unsigned long last_dangerous_ms = 0;
String last_detected_class = "";

String extractJsonString(const String& json, const char* key) {
  String needle = String("\"") + key + "\"";
  int keyPos = json.indexOf(needle);
  if (keyPos == -1) {
    return "";
  }
  int colonPos = json.indexOf(':', keyPos + needle.length());
  if (colonPos == -1) {
    return "";
  }
  int quoteStart = json.indexOf('"', colonPos + 1);
  if (quoteStart == -1) {
    return "";
  }
  int quoteEnd = json.indexOf('"', quoteStart + 1);
  if (quoteEnd == -1) {
    return "";
  }
  return json.substring(quoteStart + 1, quoteEnd);
}

bool readResponseAndPrintClass(WiFiClient& client) {
  String response;
  unsigned long waitStart = millis();

  while (client.connected() && millis() - waitStart < 10000) {
    while (client.available()) {
      char c = static_cast<char>(client.read());
      response += c;
    }
  }

  int statusCode = -1;
  int firstLineEnd = response.indexOf("\r\n");
  if (firstLineEnd != -1 && response.startsWith("HTTP/1.1 ")) {
    statusCode = response.substring(9, 12).toInt();
  }

  int bodyStart = response.indexOf("\r\n\r\n");
  String body = (bodyStart != -1) ? response.substring(bodyStart + 4) : "";

  Serial.print("HTTP status: ");
  Serial.println(statusCode);
  if (body.length() > 0) {
    Serial.println("Response body:");
    Serial.println(body);
  }

  String animalClass = extractJsonString(body, "class");
  if (animalClass.length() == 0) {
    animalClass = extractJsonString(body, "animal_class");
  }
  if (animalClass.length() == 0) {
    animalClass = extractJsonString(body, "animal");
  }

  if (animalClass.length() > 0) {
    Serial.print("Detected class: ");
    Serial.println(animalClass);
  } else {
    Serial.println("Detected class not found in response.");
  }

  last_detected_class = animalClass;

  return statusCode == 200 || statusCode == 201;
}

String toLowerCopy(String input) {
  input.toLowerCase();
  return input;
}

bool isDangerousClass(const String& cls) {
  String c = toLowerCopy(cls);
  return c == "tiger" || c == "lion" || c == "leopard" || c == "bear" || c == "boar" || c == "elephant";
}

bool isHumanClass(const String& cls) {
  String c = toLowerCopy(cls);
  return c == "human" || c == "person";
}

void buzzAlert(unsigned long duration_ms) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(duration_ms);
  digitalWrite(BUZZER_PIN, LOW);
}

void IRAM_ATTR onMotion() {
  motion_flag = true;
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 30000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("WiFi connection failed");
  }
}

bool initCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;           // lower is higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 15;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    return false;
  }
  return true;
}

// Build and send multipart/form-data with device_id and JPEG image
bool sendImageMultipart(uint8_t* img, size_t len) {
  WiFiClient client;
  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("Failed to connect to server");
    return false;
  }

  const String boundary = "----ESP32CamBoundary7MA4";

  // Parts
  String partDeviceHead = "--" + boundary + "\r\n"
                          "Content-Disposition: form-data; name=\"device_id\"\r\n\r\n";
  String partDeviceTail = "\r\n";

  String partImageHead = "--" + boundary + "\r\n"
                         "Content-Disposition: form-data; name=\"image\"; filename=\"capture.jpg\"\r\n"
                         "Content-Type: image/jpeg\r\n\r\n";
  String partImageTail = "\r\n";
  String closing = "--" + boundary + "--\r\n";

  size_t contentLength = partDeviceHead.length() + strlen(DEVICE_ID) + partDeviceTail.length()
                       + partImageHead.length() + len + partImageTail.length()
                       + closing.length();

  // Request header
  String request = String("POST ") + ENDPOINT + " HTTP/1.1\r\n";
  request += String("Host: ") + SERVER_HOST + ":" + SERVER_PORT + "\r\n";
  request += "User-Agent: ESP32HTTPClient\r\n";
  request += "Connection: close\r\n";
  request += "Content-Type: multipart/form-data; boundary=" + boundary + "\r\n";
  request += String("Content-Length: ") + contentLength + "\r\n\r\n";

  // Send header and body
  client.print(request);
  client.print(partDeviceHead);
  client.print(DEVICE_ID);
  client.print(partDeviceTail);

  client.print(partImageHead);
  client.write(img, len);
  client.print(partImageTail);

  client.print(closing);

  bool ok = readResponseAndPrintClass(client);
  client.stop();
  return ok;
}

bool captureAndSend() {
  camera_fb_t * fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return false;
  }
  bool ok = sendImageMultipart(fb->buf, fb->len);
  esp_camera_fb_return(fb);
  if (ok && last_detected_class.length() > 0) {
    unsigned long now = millis();
    if (isDangerousClass(last_detected_class)) {
      last_dangerous_ms = now;
      Serial.println("Dangerous animal spotted. Timer updated.");
    }
    if (isHumanClass(last_detected_class)) {
      if (last_dangerous_ms != 0 && (now - last_dangerous_ms) <= DANGEROUS_WINDOW_MS) {
        Serial.println("Human detected after dangerous animal. Buzzing alert.");
        buzzAlert(3000);
      } else {
        Serial.println("Human detected, but no recent dangerous animal.");
      }
    }
  }
  return ok;
}

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(PIR_PIN, INPUT_PULLDOWN);
   // use INPUT_PULLDOWN if your PIR requires it
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  attachInterrupt(digitalPinToInterrupt(PIR_PIN), onMotion, RISING);

  if (!initCamera()) {
    // Block if camera failed
    while (true) { delay(1000); }
  }
  connectWiFi();
  Serial.println("Ready. Waiting for motion...");
}

void loop() {
  if (motion_flag) {
    motion_flag = false; // consume event (simple debounce)

    unsigned long now = millis();
    if (now - last_upload_ms >= MIN_UPLOAD_INTERVAL_MS) {
      Serial.println("Motion detected: capturing and sending...");
      bool ok = captureAndSend();
      last_upload_ms = now;
      Serial.println(ok ? "Upload done" : "Upload failed");
    } else {
      Serial.println("Motion detected but throttled.");
    }
  }
  // Poll backup: if interrupt missed, check pin state
  static unsigned long lastPoll = 0;
  if (millis() - lastPoll > 200) {
    lastPoll = millis();
    int state = digitalRead(PIR_PIN);
    if (state == HIGH) {
      motion_flag = true;
    }
  }
  delay(10);
}
