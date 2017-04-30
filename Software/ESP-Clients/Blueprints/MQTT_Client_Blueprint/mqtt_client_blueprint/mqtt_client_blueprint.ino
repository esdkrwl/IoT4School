#include <ArduinoJson.h> //https://github.com/bblanchon/ArduinoJson
#include <WiFiManager.h> //https://github.com/tzapu/WiFiManager
#include <ESP8266WiFi.h> //https://github.com/esp8266/Arduino
#include <PubSubClient.h> //https://github.com/knolleary/pubsubclient
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <Arduino.h>

#define       LED0      2

const char* ssid = "Thunfisch";
const char* pw = "qwertz123";

IPAddress mqttServer(192, 168, 178, 20);
int mqttServerPort = 1883;

String type = "Sensor";
String modulName = "LDR";


String essid = "";
IPAddress ipAdresse;
String macAdresse = String(WiFi.macAddress());
char macCharArray[18];
long signalQuali = 0;
int espStatus = 0;

bool topicUpdated = false;

String lastWillTopic = "esp/lastwill/mac/" + macAdresse;
char lastWillTopicArray[100];
String lastWillPayload = "";
char lastWillPayloadArray[100];

StaticJsonBuffer<200> jsonBuffer;


WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String nameClientTopic = "nameClient/"+type+"/mac/" + macAdresse;
char nameTopicArray[100];

String prePubTopic = "esp/sensor/mac/" + macAdresse;

//String finalPubTopic = "esp/"+type+"/";
char finalPubTopicArray[100];

char dataPayloadArray[100];

long lastReconnectAttemptWiFi = 0;
long lastReconnectAttemptMQTT = 0;

void callback(char* topic, byte* payload, unsigned int length) {
  char jsonPayload[200];
  Serial.print("[Info] Daten erhalten. Topic: ");
  Serial.print(topic);
  Serial.print(", Payload: ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char) payload[i]);
    jsonPayload[i] = (char)payload[i];
  }
  Serial.println();
  
  JsonObject& root = jsonBuffer.parseObject(jsonPayload); 
  //falls nicht geparst werden konnte
  if (!root.success()) {
    Serial.println("[Error] JSON Parsing fehlgeschlagen..");
  }
  String identifier = root["identifier"];
  //sortiere Payload anhang des Identifiers aus
  if(identifier.equals("name")){
    
    Serial.println("[INFO] Idenfitifier: Name");
    String finalPubTopic = root["topic"];
    finalPubTopic.toCharArray(finalPubTopicArray, 100);
    Serial.println("[Debug] Final Topic: " + String(finalPubTopicArray));
    topicUpdated = true;
    
  } else if(identifier.equals("config")){
    Serial.println("[INFO] Idenfitifier: Config");
    
  } else if(identifier.equals("data")){
    Serial.println("[INFO] Idenfitifier: Data");
    
  } else if(identifier.equals("status")){
    Serial.println("[INFO] Idenfitifier: Status");
  }
  else {
    Serial.println("[Error] Unbekannter Identifier.");
  }
  
 
//  if(length == modulName.length() + 1){
//    modulName = "";
//    for(int i = 0; i < length; i++){
//      modulName += (char)payload[i];
//    }
//    finalPubTopic += modulName;
//    finalPubTopic.toCharArray(finalPubTopicArray, 100);
//    Serial.println("[Debug] Final Topic: " + String(finalPubTopicArray));
//    topicUpdated = true;
//  }
//  if(length == modulName.length() + 2){
//    finalPubTopic += (char)payload[1];
//    finalPubTopic.toCharArray(finalPubTopicArray, 100);
//    Serial.println("[Debug] Final Topic: " + finalPubTopic);
//    topicUpdated = true;
//  }
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pw);
  Serial.println("[INFO] Verbinde mit SSID: " + WiFi.SSID());
  while (WiFi.status() != WL_CONNECTED) {
    
    for(int i = 0; i < 10; i++){
      digitalWrite(LED0, HIGH);
      delay(250);
      digitalWrite(LED0, LOW);
      delay(250);
      Serial.print(".");  
    }

  }
  Serial.println();
  digitalWrite(LED0, !HIGH);
}

bool reconnectToWiFi() {
  if (WiFi.status() != WL_CONNECTED){
    digitalWrite(LED0, !LOW);
    return false;
  } else {
    return true;
    digitalWrite(LED0, !HIGH);
  }
}

void printWiFiInfo() {
  essid = String(WiFi.SSID());
  ipAdresse = WiFi.localIP();
  signalQuali = WiFi.RSSI();

  Serial.println("[INFO] Verbindung aufgebaut zu " + essid);
  Serial.print("[INFO] IP-Adresse ");
  Serial.println(ipAdresse);
  Serial.println("[INFO] Mac-Adresse " + macAdresse);
  Serial.println("[INFO] Signalstärke " + String(signalQuali) + " dBm");
}

void connectToBroker() {
  mqttClient.setServer(mqttServer, mqttServerPort);
  mqttClient.setCallback(callback);
  
  nameClientTopic.toCharArray(nameTopicArray, nameClientTopic.length()+1 );

  lastWillTopic.toCharArray(lastWillTopicArray, lastWillTopic.length()+1 );

  createLastWillJson();
  lastWillPayload.toCharArray(lastWillPayloadArray, 100);
  
  macAdresse.toCharArray(macCharArray, 18);
  Serial.println("[INFO] Verbinde mit MQTT Broker.");
  while (!mqttClient.connected()) {
    Serial.print(".");
    if (mqttClient.connect(macCharArray, lastWillTopicArray, 1, false, lastWillPayloadArray)) {

          mqttClient.subscribe(nameTopicArray);

    } else {
      Serial.print("[ERROR] Verbindung zum fehlgeschlagen. Fehlercode: ");
      Serial.println(mqttClient.state());
      delay(5000);
    }

  }
}

void printBrokerInfo() {
  Serial.println();
  Serial.println("[INFO] Verbindung aufgebaut zu MQTT Broker aufgebaut.");
  Serial.print("[INFO] MQTT Broker IP-Adresse ");
  Serial.println(mqttServer);

  Serial.print("[INFO] MQTT Broker Port ");
  Serial.println(mqttServerPort);
}

void publishNetworkSettings() {
  char pubTopicArray[prePubTopic.length() +1];
  prePubTopic.toCharArray(pubTopicArray, prePubTopic.length()+1 );
  
  Serial.println("[DEBUG] Topic String: " + prePubTopic);
  Serial.println("[DEBUG] Topic Array: " + String(pubTopicArray));
  
  String jsonString = createJson();
  char jsonArray[jsonString.length() + 1];
  jsonString.toCharArray(jsonArray, jsonString.length() + 1);
  
  if(mqttClient.publish(pubTopicArray, jsonArray)){
    Serial.println("[Info] Payload erfolgreich versendet.");
  } else {
    Serial.println("[Error] Payload konnte nicht versendet werden."); 
  }
}

void createLastWillJson(){
  lastWillPayload += "{";

  lastWillPayload += "\"Mac\": ";
  lastWillPayload += "\"" + macAdresse + "\", ";

  lastWillPayload += "\"Message\": ";
  lastWillPayload += "\"Verbindung verloren.\"}";
  
}

String createJson(){
  String statusPayload = "{";
  
  statusPayload += "\"Mac\": ";
  statusPayload += "\"" + macAdresse + "\", ";

  statusPayload += "\"IP\": ";
  statusPayload += "\"" + ipAdresse.toString() + "\", ";

  statusPayload += "\"Typ\": ";
  statusPayload += "\"" + type + "\", ";

  statusPayload += "\"Name\": ";
  statusPayload += "\"" + modulName + "\"}";

  Serial.println("[Debug] Payload: " + statusPayload);
  
 
  return statusPayload;
}

bool reconnectToBroker() {
  if (mqttClient.connect(macCharArray, lastWillTopicArray, 1, false, lastWillPayloadArray)){
    //hier topic subscriben
  }
  return mqttClient.connected();
}

void initOTA(){
  // Port defaults to 8266
  ArduinoOTA.setPort(8266);

  // Hostname defaults to esp8266-[ChipID]
  ArduinoOTA.setHostname("Blueprint");

  // No authentication by default
  ArduinoOTA.setPassword((const char *)"123");

  ArduinoOTA.onStart([]() {
    Serial.println("Start");
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError([](ota_error_t error) {
    Serial.printf("Error[%u]: ", error);
    if (error == OTA_AUTH_ERROR) Serial.println("Auth Failed");
    else if (error == OTA_BEGIN_ERROR) Serial.println("Begin Failed");
    else if (error == OTA_CONNECT_ERROR) Serial.println("Connect Failed");
    else if (error == OTA_RECEIVE_ERROR) Serial.println("Receive Failed");
    else if (error == OTA_END_ERROR) Serial.println("End Failed");
  });
}


void verifyConnection(){
  //Prüfe, ob WLan nicht verbunden ist,
  //falls ja führe alle 5 Sekunden einen reconnect durch
  if(WiFi.status() != WL_CONNECTED){
    Serial.println("[ERROR] Verbindung zum WiFi getrennt.");
    long now = millis();
    if(now - lastReconnectAttemptWiFi > 5000){
      lastReconnectAttemptWiFi = now;
      Serial.println("[INFO] Versuche Verbindung zum Broker aufzubauen...");
      if(reconnectToWiFi()){
        Serial.println("[INFO] Verbindung zum WiFi wieder aufgebaut.");
        lastReconnectAttemptWiFi = 0;
      } else {
        Serial.println("[ERROR] Verbindungsversuch fehlgeschlagen..."); 
      }
    } 
  } 
  // da wir nun sicher sind, dass wir mit dem Wlan verbunden sind,
  // kann geprüft werden, ob wir mit dem Broker verbunden sind.
  // Falls nicht führe auch hier alle 5 Sekunden einen Reconnect durch
  else {
    
    ArduinoOTA.handle();
    
    if(mqttClient.connected()){
      mqttClient.loop();
    } 
    else {
      Serial.println("[ERROR] Verbindung zum Broker getrennt.");
      long now = millis();
      if (now - lastReconnectAttemptMQTT > 5000) {
        lastReconnectAttemptMQTT = now;
        // Attempt to reconnect
        Serial.println("[INFO] Versuche Verbindung zum Broker aufzubauen...");
        if (reconnectToBroker()) {
          Serial.println("[INFO] Verbindung zum Broker wieder aufgebaut."); 
          lastReconnectAttemptMQTT = 0;
        } else {
          Serial.println("[ERROR] Verbindungsversuch fehlgeschlagen..."); 
        }
      }
      
    }
    
  }
  
}

void setup() {
  Serial.begin(115200);
  Serial.println();
  pinMode(LED0, OUTPUT);
  digitalWrite(LED0, !LOW);

  connectToWiFi();
  printWiFiInfo();
  connectToBroker();
  printBrokerInfo();

  publishNetworkSettings();
  initOTA();
  ArduinoOTA.begin();


}

void loop() {
  ArduinoOTA.handle();
  mqttClient.loop();

  if(topicUpdated){
    Serial.println("[DEBUG] Neues Topic wurde geupdated." );
    mqttClient.unsubscribe(nameTopicArray);
    mqttClient.subscribe(finalPubTopicArray);
    topicUpdated = false;
  }


}

