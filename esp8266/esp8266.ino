#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

/******** WIFI ********/
#define WIFI_SSID     "Varshini"
#define WIFI_PASSWORD "17032006"

/******** FIREBASE ********/
#define FIREBASE_HOST "https://real-time-animal-monitoring-default-rtdb.firebaseio.com/sensorLogs.json/"
#define FIREBASE_AUTH ""   // empty if test mode

/******** PINS ********/
#define PIR_PIN    14   // D5
#define BUZZER_PIN 4    // D2

FirebaseData fbdo;
bool pirState = LOW;

void setup() {
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  /******** WIFI ********/
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi Connected");
  Serial.println(WiFi.localIP());

  /******** FIREBASE ********/
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);

  Serial.println("PIR + Buzzer + Firebase Ready");
}

void loop() {

  bool pirValue = digitalRead(PIR_PIN);

  // Motion START
  if (pirValue == HIGH && pirState == LOW) {
    Serial.println("🚨 Motion detected");
    beep();

    Firebase.setBool(fbdo, "/pir/motion", true);
    Firebase.setInt(fbdo, "/pir/timestamp", millis());

    pirState = HIGH;
  }

  // Motion END
  if (pirValue == LOW && pirState == HIGH) {
    Serial.println("✅ Motion ended");

    Firebase.setBool(fbdo, "/pir/motion", false);
    Firebase.setInt(fbdo, "/pir/timestamp", millis());

    pirState = LOW;
  }

  delay(50);
}

void beep() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(200);
  digitalWrite(BUZZER_PIN, LOW);
}
