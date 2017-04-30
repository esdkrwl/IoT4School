#include <ArduinoJson.h> //https://github.com/bblanchon/ArduinoJson
#include <WiFiManager.h> //https://github.com/tzapu/WiFiManager
#include <ESP8266WiFi.h> //https://github.com/esp8266/Arduino
#include <PubSubClient.h> //https://github.com/knolleary/pubsubclient
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <Arduino.h>

#define       LED0      2
#define       PotiPin   A0

//TEST
long lastMsg = 0;
char msg[50];
int value = 0;
int potiWert = 0;
int potiWertAlt = 0;
int threshold = 10;
int intervall = 100;
//TEST

const char* ssid = "Thunfisch";
const char* pw = "qwertz123";

IPAddress mqttServer(192, 168, 178, 20);
int mqttServerPort = 1883;

String type = "Sensor";
String modulName = "yyyy";


String essid = "";
IPAddress ipAdresse;

String macAdresse = String(WiFi.macAddress());
char macCharArray[18];

long signalQuali = 0;
int espStatus = 0;

bool topicUpdated = false;
bool newTopicFlag = false;

String lastWillTopic = "esp/lastwill/mac/" + macAdresse;
char lastWillTopicArray[200];

String lastWillPayload = "";
char lastWillPayloadArray[200];


WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);



const char* pythonTopic = "esp/reconnect";

String nameClientTopic = "nameClient/"+type+"/mac/" + macAdresse;
char nameTopicArray[200];

char clientStatusArray[200];

String prePubTopic = "esp/sensor/mac/" + macAdresse;
char prePubTopicArray[200];

char finalPubTopicArray[200];

char dataPayloadArray[200];

long lastReconnectAttempt = 0;


/*
 * MQTT Callback Methode
 * Wird aufgerufen, wenn Daten empfangen wurden.
 * Daten werden in Char Array geschrieben und in JSON Objekt geparst
 * Es werden 4 verschiedene identifier unterschieden
 * name: enthält im Payload den neuen Namen des Clients
 * config: enthälig im Payload neue Configparameter für den Client
 * data: enthält Daten, die einen Aktor steuern sollen
 * status: fordert den Client auf, seinen aktuellen Status zu publishen
 */
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
  //WICHTIG - Buffer hier anlegen und nicht global!
  StaticJsonBuffer<200> jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(jsonPayload); 
  //Falls kein JSON vorliegt, wird die Nachricht verworfen
  if (!root.success()) {
    
    Serial.println("[ERROR] JSON Parsing fehlgeschlagen..");
    
  } else {
    
    Serial.println("[INFO] JSON Parsing erfolgreich..");
    
    //Prüfe, ob der key identifier vorhanden ist, falls nicht verwerfen
    if(root.containsKey("identifier")){
      
      if(root["identifier"] == "name"){
        Serial.println("[DEBUG] Identifier gefunden: Name");
        onName(root);

      } 
      else if(root["identifier"] == "config"){
        
        Serial.println("[DEBUG] Identifier gefunden: Config");
        onConfig(root);
        
      }
      else if(root["identifier"] == "data"){
        
        Serial.println("[DEBUG] Identifier gefunden: Data");
        onData(root);
        
      } 
      else if(root["identifier"] == "status"){
        
        Serial.println("[DEBUG] Identifier gefunden: Status");
        onStatus(root);
        
      } 
      else {
        Serial.print("[ERROR] Unbekannter Identifier: ");
        String identifierString = root["identifier"];
        Serial.println(identifierString);
      }
      
    } else {
      Serial.println("[ERROR] Keinen Identifier gefunden");
    }
  }
}
/*
 * Callback Methode, falls der Identifier Name im Payload gefunden wurde
 */
void onName(JsonObject& j){
  Serial.println("[DEBUG] Greetz aus onName");
  String finalPubTopic = j["topic"];
  finalPubTopic.toCharArray(finalPubTopicArray, 200);
  Serial.println("[Debug] Final Topic: " + String(finalPubTopicArray));
  topicUpdated = true;
}

/*
 * Callback Methode, falls der Identifier Config im Payload gefunden wurde
 */
void onConfig(JsonObject& j){
  Serial.println("[DEBUG] Greetz aus onConfig");
  
}

/*
 * Callback Methode, falls der Identifier Data im Payload gefunden wurde
 */
void onData(JsonObject& j){
  Serial.println("[DEBUG] Greetz aus onData");
  String test = j["b"];
  Serial.println(test);
  
}

/*
 * Callback Methode, falls der Identifier Status im Payload gefunden wurde
 */
void onStatus(JsonObject& j){
  Serial.println("[DEBUG] Greetz aus onStatus");
  
}

/*
 * Setzt ESP Modul in den Station Mode
 * und setzt Logindaten des Netzwerkes
 */
void setupWiFi(){
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, pw);
}

/*
 * Verbindet sich mit dem WLAN
 * Verbindungsversuch alle 5 Sekunden
 */
bool connectToWiFi() {
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
  return true;
}

/*
 * Gibt nach dem erfolgreichen Verbindungsversuch
 * einige Informationen über das Netzwerk aus
 */
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

/*
 * Bereitet MQTT Verbindung zum Broker vor
 * Server und Callback werden definiert
 */
void setupMqtt(){
  mqttClient.setServer(mqttServer, mqttServerPort);
  mqttClient.setCallback(callback);
  
  nameClientTopic.toCharArray(nameTopicArray, nameClientTopic.length()+1 );

  lastWillTopic.toCharArray(lastWillTopicArray, lastWillTopic.length()+1 );

  createLastWillJson();
  lastWillPayload.toCharArray(lastWillPayloadArray, 200);
  
  macAdresse.toCharArray(macCharArray, 18);
}

/*
 * Verbindet sich mit dem MQTT Broker
 */
void connectToBroker() {

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

/*
 * Verbindet sich erneut mit dem Broker, falls die Verbindung verloren gegangen sein sollte.
 * Im Gegensatz zu connectToBroker, blockt diese Funktion den Programmablauf nicht, sagt dem
 * Python Skript, dass man wieder verbunden ist und setzt die Subscriptions neu
 */

 bool reconnectToBroker() {
  /*
   * @params in
   * macCharArray         - ClientID
   * lastWillTopicArray   - willTopic
   * 1                    - willQoS
   * false                - willRetain
   * lastWillPayloadArray - willMessage
   * 
   */
  if (mqttClient.connect(macCharArray, lastWillTopicArray, 1, false, lastWillPayloadArray)){
    /*
     * alte Topics wieder subscriben
     * falls man schon das neue Topic hat, muss man das alte nicht erneut subscriben
     */
    if(newTopicFlag){
      // esp/xxxx/yyyy
      mqttClient.subscribe(finalPubTopicArray);
      //Python Bescheid sagen, dass man wieder da ist, damit die DB wieder aktualisiert werden kann
      createClientStatusJson().toCharArray(clientStatusArray, 200);
      if(mqttClient.publish(pythonTopic, clientStatusArray)){
        Serial.println("[DEBUG] Python ist informiert");  
      } else {
        Serial.println("[DEBUG] Python ist nicht informiert");  
      }
    } else {
      // nameClient/xxxx/mac/aa:bb:cc:dd:ee
      mqttClient.subscribe(nameTopicArray);
      //Python bescheid sagen, dass wir immer noch keinen neuen Namen haben.
      publishNetworkSettings();
    }
  }
  return mqttClient.connected();
}

/*
 * Gibt Informationen zum Broker in der Konsole aus
 * Wird nach dem erstmaligen verbinden angezeigt.
 */
void printBrokerInfo() {
  Serial.println();
  Serial.println("[INFO] Verbindung zum MQTT Broker aufgebaut.");
  Serial.print("[INFO] MQTT Broker IP-Adresse ");
  Serial.println(mqttServer);

  Serial.print("[INFO] MQTT Broker Port ");
  Serial.println(mqttServerPort);
  Serial.println();
}


/*
 * Sendet die Statusinformationen des Clients an das Python Skript
 * Zu den Informationen gehören
 * Mac IP Typ und Name des Moduls
 */
void publishNetworkSettings() {
  
  prePubTopic.toCharArray( prePubTopicArray, 200 );
  
  Serial.println("[DEBUG] Topic String: " + prePubTopic);
  Serial.println("[DEBUG] Topic Array: " + String(prePubTopicArray));
  
  createClientStatusJson().toCharArray(clientStatusArray, 200 );
  
  if(mqttClient.publish(prePubTopicArray, clientStatusArray)){
    Serial.println("[Info] Status - Payload erfolgreich versendet.");
  } else {
    Serial.println("[Error] Status - Payload konnte nicht versendet werden."); 
  }
}

/*
 * String im JSON Format
 * wird versendet, wenn der Client die Verbindung zum Broker verliert.
 */
void createLastWillJson(){
  lastWillPayload += "{";

  lastWillPayload += "\"Mac\": ";
  lastWillPayload += "\"" + macAdresse + "\", ";

  lastWillPayload += "\"Message\": ";
  lastWillPayload += "\"Verbindung verloren.\"}";
}

/*
 * String im JSON Format 
 * wird versendet, um den Python Skript über den Status des Clients zu informieren
 */
String createClientStatusJson(){
  String statusPayload = "{";
  
  statusPayload += "\"Mac\": ";
  statusPayload += "\"" + macAdresse + "\", ";

  statusPayload += "\"IP\": ";
  statusPayload += "\"" + ipAdresse.toString() + "\", ";

  statusPayload += "\"Typ\": ";
  statusPayload += "\"" + type + "\", ";

  statusPayload += "\"Name\": ";
  statusPayload += "\"" + modulName + "\"}";

  Serial.println("[Debug] Status-Payload als JSON: " + statusPayload);
  
 
  return statusPayload;
}


/*
 * Konfiguration der OTA Schnittstelle
 */
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

/*
 * Prüft regelmäßig, ob Verbindung zum WLAN besteht.
 * Falls nicht wird ein reconnect durchgeführt.
 * 
 * Falls WLAN verbunden, wird geprüft, ob Verbindung zum MQTT Broker steht.
 * Falls nicht wird alle 5 Sekunden ein reconnect durchgeführt
 */
void verifyConnection(){

  if(WiFi.status() != WL_CONNECTED){
    connectToWiFi();
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
      Serial.println();
      Serial.println("[ERROR] Verbindung zum Broker getrennt.");
      long now = millis();
      
      if (now - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = now;
       
        Serial.println("[INFO] Versuche Verbindung zum Broker aufzubauen...");
        
        if (reconnectToBroker()) {
          
          Serial.println("[INFO] Verbindung zum Broker wieder aufgebaut.");
          Serial.println();
          lastReconnectAttempt = 0;
          
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
  
  setupWiFi();
  setupMqtt();
  
  connectToWiFi();
  printWiFiInfo();
  
  connectToBroker();
  printBrokerInfo();

  publishNetworkSettings();
  
  initOTA();
  ArduinoOTA.begin();
}

void loop() {

  potiWert = analogRead(PotiPin);
  delay(3);
  
  verifyConnection();

  if(topicUpdated){
    Serial.println("[DEBUG] Neues Topic wurde geupdated." );
    mqttClient.unsubscribe(nameTopicArray);
    //mqttClient.subscribe(finalPubTopicArray);
    topicUpdated = false;
    newTopicFlag = true;
  }


/*
  int potiWert = 0;
int potiWertAlt = 0;
int threshold = 10;
int intervall = 100;
*/
  
//DEBUG ZEUGS
  long now = millis();
  if (now - lastMsg > 2000) {
    lastMsg = now;
    ++value;
    snprintf (msg, 75, "PotiWert #%ld", potiWert);
    Serial.print("Publish message: ");
    Serial.println(msg);
    if(newTopicFlag){
      if(mqttClient.publish(finalPubTopicArray, msg)){
        Serial.println("Erfolg");
      } else {
        Serial.println("Misserfolg");
      }
      
    }

  }
//DEBUG ZEUGS


}

