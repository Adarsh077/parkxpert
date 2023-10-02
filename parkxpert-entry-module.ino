
/* CAR PARKING ENTRY MODULE */

#include <Arduino.h>
#include <WiFi.h>
#include <ESP32Servo.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_camera.h"

#define FLASH_GPIO_NUM 4


int outsideIr = 13;
int insideIr = 14;
int servoPin = 15;

// CONFIG
const char* ssid = "AJ";
const char* password = "Adarsh890$";

int waitForSecondsAfterPhotoCapture = 8;
int maxTimeoutSecondsForOpenGate = 10;
int minTimeoutSecondsForOpenGate = 5;

String plateDetectionServerIp = "192.168.0.106";
String plateDetectionServerPath = "/";
const int plateDetectionServerPort = 5000;

String parkingEntryUrl = "http://192.168.0.106:8000/parking/entry";

int pos = 0;

Servo myservo;
WiFiClient client;

// CAMERA_MODEL_AI_THINKER
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

bool isGateOpen = false;
String detectedCarNumber = "MH48AT2469";

void setup() {
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  pinMode(outsideIr, INPUT);
  pinMode(insideIr, INPUT);
  pinMode(FLASH_GPIO_NUM, OUTPUT);
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  myservo.setPeriodHertz(50);
  myservo.attach(servoPin, 1000, 2000);
  myservo.write(0);

  Serial.begin(115200);

  WiFi.mode(WIFI_STA);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print("Connecting to WiFi..");
    delay(500);
  }
  Serial.println();
  Serial.print("ESP32-CAM IP Address: ");
  Serial.println(WiFi.localIP());

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
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  // init with high specs to pre-allocate larger buffers
  if (psramFound()) {
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 10;  //0-63 lower number means higher quality
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_CIF;
    config.jpeg_quality = 12;  //0-63 lower number means higher quality
    config.fb_count = 1;
  }

  // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    delay(1000);
    ESP.restart();
  }
}

void loop() {
  int hasDetectedObject = digitalRead(outsideIr);
  Serial.println("Detecting Object...");
  if (hasDetectedObject == 0 && isGateOpen == false) {
    Serial.println("Object Detected!");
    String body = captureAndSendPhoto();
    Serial.println(body);
    if (body.equals("Not detected")) {
      Serial.print("Number not detected! Waiting for ");
      Serial.print(waitForSecondsAfterPhotoCapture);
      Serial.println(" seconds");
      delay(waitForSecondsAfterPhotoCapture * 1000);
    } else {
      detectedCarNumber = body;
      Serial.println("Number detected! Opening Gate...");
      myservo.write(180);
      Serial.println("Waiting for car passage...");

      int hasCarEntered = waitForCarPassage();
      Serial.println("Closing Gate...");
      myservo.write(0);


      if(hasCarEntered) {
        sendCarEntry();
      }
    }
  }
  delay(1000);
}

bool waitForCarPassage() {
  // Gate should be open for minimum seconds
  // Gate should close on car passage
  // Gate should close after max time

  bool isObjectAlreadyDetected = false;
  bool shouldCloseAfterMinimumTimout = false;

  double secondsSinceGateOpen = 0;

  while (secondsSinceGateOpen <= maxTimeoutSecondsForOpenGate) {
    int hasDetectedObject = digitalRead(insideIr);


    if (hasDetectedObject == 0) {
      isObjectAlreadyDetected = true;
      secondsSinceGateOpen = secondsSinceGateOpen + 0.5;
      delay(500);
      continue;
    }

    if (shouldCloseAfterMinimumTimout && secondsSinceGateOpen == minTimeoutSecondsForOpenGate) {
      return true;
    }


    if (isObjectAlreadyDetected == true && secondsSinceGateOpen < minTimeoutSecondsForOpenGate) {
      secondsSinceGateOpen = secondsSinceGateOpen + 0.5;
      shouldCloseAfterMinimumTimout = true;
      delay(500);
      continue;
    }

    if (isObjectAlreadyDetected == true) {
      return true;
    }

    secondsSinceGateOpen = secondsSinceGateOpen + 0.5;

    delay(500);
  }

  Serial.println("## OUTSIDE WHILE LOOP ##");
  Serial.println("RETURN");
  return false;
}

String captureAndSendPhoto() {
  String getAll;
  String getBody;

  camera_fb_t* fb = NULL;
  Serial.println("Capturing Photo!");
  fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Camera capture failed");
    delay(1000);
    ESP.restart();
  }

  Serial.println("Connecting to server: " + plateDetectionServerIp);

  if (client.connect(plateDetectionServerIp.c_str(), plateDetectionServerPort)) {
    Serial.println("Connection successful!");
    Serial.println("Sending Photo!");

    String head = "--RandomNerdTutorials\r\nContent-Disposition: form-data; name=\"photo\"; filename=\"esp32-cam.jpg\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--RandomNerdTutorials--\r\n";

    uint32_t imageLen = fb->len;
    uint32_t extraLen = head.length() + tail.length();
    uint32_t totalLen = imageLen + extraLen;

    client.println("POST " + plateDetectionServerPath + " HTTP/1.1");
    client.println("Host: " + plateDetectionServerIp);
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=RandomNerdTutorials");
    client.println();
    client.print(head);

    uint8_t* fbBuf = fb->buf;
    size_t fbLen = fb->len;
    for (size_t n = 0; n < fbLen; n = n + 1024) {
      if (n + 1024 < fbLen) {
        client.write(fbBuf, 1024);
        fbBuf += 1024;
      } else if (fbLen % 1024 > 0) {
        size_t remainder = fbLen % 1024;
        client.write(fbBuf, remainder);
      }
    }
    client.print(tail);

    esp_camera_fb_return(fb);

    int timoutTimer = 10000;
    long startTimer = millis();
    boolean state = false;

    while ((startTimer + timoutTimer) > millis()) {
      Serial.print(".");
      delay(100);
      while (client.available()) {
        char c = client.read();
        if (c == '\n') {
          if (getAll.length() == 0) { state = true; }
          getAll = "";
        } else if (c != '\r') {
          getAll += String(c);
        }
        if (state == true) { getBody += String(c); }
        startTimer = millis();
      }
      if (getBody.length() > 0) { break; }
    }
    client.stop();

    getBody.trim();
  } else {
    getBody = "Connection to " + plateDetectionServerIp + " failed.";
    Serial.println(getBody);
  }
  return getBody;
}


void sendCarEntry() {
  Serial.println("Calling CAR ENTRY API...");
  HTTPClient http;

  http.begin(parkingEntryUrl);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  // Add values in the document
  //
  doc["carId"] = detectedCarNumber;


  String requestBody;
  serializeJson(doc, requestBody);

  int httpResponseCode = http.POST(requestBody);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println(httpResponseCode);
    Serial.println(response);
  } else {
    Serial.printf("Error occurred while sending HTTP POST: %s\n", http.errorToString(httpResponseCode).c_str());
  }
}
