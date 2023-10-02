#include "WiFi.h"
#include "ESPAsyncWebServer.h"
 
const char* ssid = "AJ";
const char* password =  "Adarsh890$";
 
AsyncWebServer server1(80);
 
void setup(){
  Serial.begin(115200);
 
  WiFi.begin(ssid, password);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
  }
 
  Serial.println(WiFi.localIP());
 
  server1.on("/hello", HTTP_GET, [](AsyncWebServerRequest *request){
    request->send(200, "text/plain", "Hello from server 1");
  });
 
  server1.begin();
}
 
void loop(){}