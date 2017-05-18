#include <FS.h>
#include <ArduinoJson.h> //https://github.com/bblanchon/ArduinoJson
#include <WiFiManager.h> //https://github.com/tzapu/WiFiManager
#include <ESP8266WiFi.h> //https://github.com/esp8266/Arduino
#include <PubSubClient.h> //https://github.com/knolleary/pubsubclient
#include <ESP8266mDNS.h>
#include <WiFiUdp.h>
#include <ArduinoOTA.h>
#include <Arduino.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <DHT.h> //https://github.com/adafruit/DHT-sensor-library WICHTIG: diese Lib muss auch installiert sein https://github.com/adafruit/Adafruit_Sensor

//Board-LED
#define       LED0      2
#define       DHTPIN    10
#define       LDRPIN    A0
#define       DHTTYPE   DHT22

// Typ des Moduls - Sensor oder Aktor
String type = "Sensor";
// Name des Moduls - z.B. RGB-LED, Smart-Button etc..
String modulName = "Wetter";

// ------ HIER RELEVANTER MODUL PARAMETER SAMMELN ------
DHT dht(DHTPIN, DHTTYPE);
enum modus {
  ECO, PWR
};
int energieModus = ECO;

//Schlafdauer in Zeit in Sekunden
int deepSleepDuration = 60;
//Messdauer in Zeit in Sekuden
int messureDuration = 60;

int sampleSize = 3;
int messCounter = 0;

float humidity = 0;
float averageHumidity = 0;

float temperature = 0;
float averageTemperature = 0;

int ldrValue = 0;
float averageLdrValue = 0;

float heatIndex = 0;
float averageHeatIndex = 0;

//wird jeden loop gesetzt
long timestamp1 = 0;
//wird alle zwei Sekunden gesetzt
long timestamp2 = 0;
//wird gesetzt um zu gucken ob die messzeit abgelaufen ist
long timestamp3 = 0;

//Flag um sicher zu gehen, dass wir nicht in den Deepsleep gehen bevor der Payload nicht versendet wurde
bool payloadSent = false;

// -----------------------------------------------------


//Passwort für OTA Update
const char* otaPW = "123";

// Char Arrays um MQTT-Daten aus dem EEPROM zwischen zu speichern
char mqtt_server[40];
char mqtt_port[6];

// Netzwerkzeugs
IPAddress ipAdresse;
String macAdresse = String(WiFi.macAddress());
char macCharArray[18];

//wird nur noch benötigt, um MQTT Client zu initialisieren
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Topic: esp/lastwill/mac/MAC_ADR
char lastWillTopicArray[200];
// enthält die Meldung, dass der Client die Verbindung zum Broker verloren hat
char lastWillPayloadArray[200];

//Topic um dem Python Skript zu sagen, dass der Client wieder verbunden ist nach kurzem Verbindungsverlust
const char* pythonTopic = "esp/reconnect";
//Topic esp/TYPE/mac/MAC_ADR
char nameTopicArray[200];
// wird vom Python Skript benötigt: enthält Infos über IP, Mac und Gerätenamen
char clientStatusArray[200];

// über diese Topics kommuniziert das Modul mit Node-Red. Das Suffix wurde vom Python-Skript zugeteilt
// pub/TYPE/NAME+SUFFIX
char finalPubTopicArray[200];
// sub/TYPE/NAME+SUFFIX
char finalSubTopicArray[200];

// millis Timestamp um festzustellen, ob 5 Sekunden seit dem letzten Reconnect zum Broker vergangen sind.
long lastReconnectAttempt = 0;
// millis Timestamp um festzustellen, ob 5 Sekunden seit dem letzten Versuch einen Namen zu erhalten vergangen sind.
long lastPublishAttempt = 0;
// Zähler um misslungene Versuche sich mit dem Broker zu verbinden zu zählen
int mqttStrikes = 0;
// Flag um festzustellen, ob das Modul bereits den neuen Namen vom Python Skript erhalten hat
bool topicUpdated = false;

// TESTZEUGS
long lastMsg = 0;
char msg[50];
int value = 0;
boolean setReset = false;
bool shouldSaveConfig = false;
String nameString;

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
  Serial.print("[INFO] Daten erhalten. Topic: ");
  Serial.print(topic);
  Serial.print(", Payload: ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char) payload[i]);
    jsonPayload[i] = (char) payload[i];
  }
  Serial.println();
  //WICHTIG - Buffer hier anlegen und nicht global!
  StaticJsonBuffer < 200 > jsonBuffer;
  JsonObject& root = jsonBuffer.parseObject(jsonPayload);
  //Falls kein JSON vorliegt, wird die Nachricht verworfen
  if (!root.success()) {

    Serial.println("[ERROR] JSON Parsing fehlgeschlagen..");

  } else {

    Serial.println("[INFO] JSON Parsing erfolgreich..");

    //Prüfe, ob der key identifier vorhanden ist, falls nicht verwerfen
    if (root.containsKey("identifier")) {

      if (root["identifier"] == "name") {
        Serial.println("[DEBUG] Identifier gefunden: Name");
        onName(root);

      } else if (root["identifier"] == "config") {

        Serial.println("[DEBUG] Identifier gefunden: Config");
        onConfig(root);

      } else if (root["identifier"] == "data") {

        Serial.println("[DEBUG] Identifier gefunden: Data");
        onData(root);

      } else if (root["identifier"] == "status") {

        Serial.println("[DEBUG] Identifier gefunden: Status");
        onStatus(root);

      } else {
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
void onName(JsonObject& j) {

  Serial.println("[DEBUG] Greetz aus onName");

  //wenn new_name und suffix im Payload stehen, kann der neue Name gesetzt werden
  if (j.containsKey("new_name") && j.containsKey("suffix")) {
    String newName = j["new_name"];
    nameString = newName;

    String suffix = j["suffix"];

    String finalSubTopic = "sub/" + type + "/" + modulName + "/" + suffix;
    String finalPubTopic = "pub/" + type + "/" + modulName + "/" + suffix;

    finalPubTopic.toCharArray(finalPubTopicArray, 200);
    finalSubTopic.toCharArray(finalSubTopicArray, 200);
    Serial.println(
        "[DEBUG] Final Sub Topic: " + String(finalSubTopicArray));
    Serial.println(
        "[DEBUG] Final Pub Topic: " + String(finalPubTopicArray));
    topicUpdated = true;
  }

}
/*
 * Callback Methode, falls der Identifier Config im Payload gefunden wurde
 */
void onConfig(JsonObject& j) {
  Serial.println("[DEBUG] Greetz aus onConfig");
  //key prüfen
  if (j.containsKey("set_deepSleepDuration")) {
    //datentyp prüfen
    if(j["set_deepSleepDuration"].is<int>()){
      //wertebereich prüfen
      if( j["set_deepSleepDuration"] > 0 && j["set_deepSleepDuration"] <= 86400){
        deepSleepDuration = j["set_deepSleepDuration"]; 
      }
    }  
  }

  //key prüfen
  if (j.containsKey("set_messureDuration")) {
    //datentyp prüfen
    if(j["set_messureDuration"].is<int>()){
      //wertebereich prüfen
      if( j["set_messureDuration"] > 0 && j["set_messureDuration"] <= 1024){
        messureDuration = j["set_messureDuration"];
      }
    }  
  }

  //key prüfen
  if (j.containsKey("set_mode")) {
    //datentyp prüfen
    if(j["set_mode"].is<const char*>()){
      //wertebereich prüfen
      if( j["set_mode"] == "eco"){
        energieModus = ECO;
      }
      if(j["set_mode"] == "pwr"){
        energieModus = PWR;
      }
    }  
  }

}

/*
 * Callback Methode, falls der Identifier Data im Payload gefunden wurde
 */
void onData(JsonObject& j) {
  Serial.println("[DEBUG] Greetz aus onData");
}

/*
 * Callback Methode, falls der Identifier Status im Payload gefunden wurde
 */
void onStatus(JsonObject& j) {
  Serial.println("[DEBUG] Greetz aus onStatus");
  String payload;
  if(energieModus == ECO){
      payload = "{\"identifier\":\"status\",\"mode\":\"eco\",\"deepSleepDuration\":"
      + String(deepSleepDuration) + ", \"messurementDuration\":"
      + String(messureDuration) + "}";
    
  }
  if(energieModus == PWR){
      payload = "{\"identifier\":\"status\",\"mode\":\"pwr\",\"deepSleepDuration\":"
      + String(deepSleepDuration) + ", \"messurementDuration\":"
      + String(messureDuration) + "}";
    
  }
  


  char payloadArray[200];
  payload.toCharArray(payloadArray, 200);

  if (mqttClient.publish(finalPubTopicArray, payloadArray)) {
    Serial.println("[INFO] Status Payload erfolgreich versendet.");
    blink();
  } else {
    Serial.println("[ERROR] Status Payload nicht versendet.");
  }
  Serial.println();
}

/*
 * Speicher Callback zum Übernehmen der Webparameter vom WiFi Manager zu übernehmen
 */
void saveConfigCallback() {
  Serial.println("Should save config");
  shouldSaveConfig = true;
}

/*
 * Initialisiert und startet den WiFiManager
 *
 */
void initWifiManager() {
  WiFiManager wifiManager;
  /*
   * CallBack Funktion, falls Daten gespeichert werden sollen
   */
  wifiManager.setSaveConfigCallback(saveConfigCallback);

  /*
   * MQTT Server und Port als Extra Params
   */
  WiFiManagerParameter custom_mqtt_server("server", "mqtt server",
      mqtt_server, 40);
  WiFiManagerParameter custom_mqtt_port("port", "mqtt port", mqtt_port, 5);

  wifiManager.addParameter(&custom_mqtt_server);
  wifiManager.addParameter(&custom_mqtt_port);

  if (setReset) {
    wifiManager.resetSettings();
  }
  //wifiManager.setTimeout(180);

  if (!wifiManager.autoConnect("IoT4School", "IoT-PW")) {
    //überflüssig nun
    Serial.println("[ERROR] failed to connect and hit timeout");
    delay(3000);
    //reset and try again, or maybe put it to deep sleep
    ESP.reset();
    delay(5000);
  }
  //Verbunden
  digitalWrite(LED0, !HIGH);

  strcpy(mqtt_server, custom_mqtt_server.getValue());
  strcpy(mqtt_port, custom_mqtt_port.getValue());

}
/*
 * Metohde zum Lssen der Konfigparameter
 */
void readConfigFromFS() {
  if (SPIFFS.begin()) {
    Serial.println("[INFO] Datei gefunden.");
    if (SPIFFS.exists("/config.json")) {
      
      Serial.println("[INFO] Lade Config Datei...");
      File configFile = SPIFFS.open("/config.json", "r");
      if (configFile) {
        size_t size = configFile.size();
        
        std::unique_ptr<char[]> buf(new char[size]);

        configFile.readBytes(buf.get(), size);
        DynamicJsonBuffer jsonBuffer;
        JsonObject& json = jsonBuffer.parseObject(buf.get());
        json.printTo(Serial);
        if (json.success()) {
          Serial.println("\nparsed json");

          strcpy(mqtt_server, json["mqtt_server"]);
          strcpy(mqtt_port, json["mqtt_port"]);

        } else {
          Serial.println("[ERROR] Datei gefunden.");
        }
      }
    }
  } else {
    Serial.println("[ERROR] Datei nicht gefunden.");
  }
}

/*
 * Methode zum Speichern der Konfigparameter
 */
void saveConfigParams() {
  Serial.println("[INFO] Speichere Config..");
  DynamicJsonBuffer jsonBuffer;
  JsonObject& json = jsonBuffer.createObject();
  json["mqtt_server"] = mqtt_server;
  json["mqtt_port"] = mqtt_port;

  File configFile = SPIFFS.open("/config.json", "w");
  if (!configFile) {
    Serial.println("[ERROR] Config Datei konnte nicht geöffnet werden.]");
  } else {
    json.printTo(Serial);
    json.printTo(configFile);
    Serial.println();
  }
  configFile.close();

}

/*
 * Verbindet sich mit dem WLAN
 * Verbindungsversuch alle 5 Sekunden
 */
bool connectToWiFi() {
  Serial.println("[INFO] Verbinde mit SSID: " + WiFi.SSID());
  while (WiFi.status() != WL_CONNECTED) {

    for (int i = 0; i < 10; i++) {
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
 * Lässt die Status-LED des ESP Moduls einige male aufblinken
 */
void blink() {
  for (int i = 0; i < 10; i++) {
    digitalWrite(LED0, HIGH);
    delay(100);
    digitalWrite(LED0, LOW);
    delay(100);
  }
}

/*
 * Gibt nach dem erfolgreichen Verbindungsversuch
 * einige Informationen über das Netzwerk aus
 */
void printWiFiInfo() {
  String essid = String(WiFi.SSID());
  ipAdresse = WiFi.localIP();
  long signalQuali = WiFi.RSSI();

  Serial.println();
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
void setupMqtt() {

  //mqttServer(192, 168, 178, 20);
  //mqttServerPort = 1883;
  //mqttClient.setServer(mqttServer, mqttServerPort);
  mqttClient.setServer(mqtt_server, atoi(mqtt_port));
  mqttClient.setCallback(callback);
  String nameClientTopic = "nameClient/" + type + "/mac/" + macAdresse;
  nameClientTopic.toCharArray(nameTopicArray, nameClientTopic.length() + 1);
  String lastWillTopic = "esp/lastwill/mac/" + macAdresse;
  lastWillTopic.toCharArray(lastWillTopicArray, lastWillTopic.length() + 1);

  createLastWillJson().toCharArray(lastWillPayloadArray, 200);

  macAdresse.toCharArray(macCharArray, 18);
}

/*
 * Verbindet sich mit dem MQTT Broker
 */
void connectToBroker() {

  Serial.println("[INFO] Verbinde mit MQTT Broker.");
  while (!mqttClient.connected()) {
    Serial.print(".");
    if (mqttClient.connect(macCharArray, lastWillTopicArray, 1, false,
        lastWillPayloadArray)) {
      Serial.println("blalbla");
      Serial.println(nameTopicArray);
      mqttClient.subscribe(nameTopicArray);
      mqttStrikes = 0;

    } else {
      Serial.print(
          "[ERROR] Verbindung zum Broker fehlgeschlagen. Fehlercode: ");
      Serial.println(mqttClient.state());
      delay(5000);
      mqttStrikes++;
    }
    /*
     * Falls sich nach dem dritten Versuch nicht mit dem Broker verbunden werden konnte,
     * wird der Webserver erneut gestartet
     * dort kann man nochmal die Parameter für den Broker überprüfen
     */
    if (mqttStrikes == 3) {
      mqttStrikes = 0;
      WiFiManager wifiManager;

      /*
       * CallBack Funktion, falls Daten gespeichert werden sollen
       */
      wifiManager.setSaveConfigCallback(saveConfigCallback);

      /*
       * MQTT Server und Port als Extra Params
       */
      WiFiManagerParameter custom_mqtt_server("server", "mqtt server",
          mqtt_server, 40);
      WiFiManagerParameter custom_mqtt_port("port", "mqtt port",
          mqtt_port, 5);

      wifiManager.addParameter(&custom_mqtt_server);
      wifiManager.addParameter(&custom_mqtt_port);

      wifiManager.setTimeout(180);
      if (!wifiManager.startConfigPortal("MQTT-AP", "password")) {
        Serial.println("failed to connect and hit timeout");
        delay(3000);
        //reset and try again, or maybe put it to deep sleep
        ESP.reset();
        delay(5000);
      } else {
        strcpy(mqtt_server, custom_mqtt_server.getValue());
        strcpy(mqtt_port, custom_mqtt_port.getValue());
        mqttClient.setServer(custom_mqtt_server.getValue(),
            atoi(custom_mqtt_port.getValue()));
        saveConfigParams();
      }

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
  if (mqttClient.connect(macCharArray, lastWillTopicArray, 1, false,
      lastWillPayloadArray)) {
    /*
     * alte Topics wieder subscriben
     * falls man schon das neue Topic hat, muss man das alte nicht erneut subscriben
     */
    if (topicUpdated) {
      // esp/TYPE/NAME
      mqttClient.subscribe(finalSubTopicArray);
      //Python Bescheid sagen, dass man wieder da ist, damit die DB wieder aktualisiert werden kann
      createClientStatusJson().toCharArray(clientStatusArray, 200);
      if (mqttClient.publish(pythonTopic, clientStatusArray)) {
        Serial.println("[DEBUG] Python über RC informiert");
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
  Serial.println(mqtt_server);

  Serial.print("[INFO] MQTT Broker Port ");
  Serial.println(mqtt_port);
  Serial.println();
}

/*
 * Sendet die Statusinformationen des Clients an das Python Skript
 * Zu den Informationen gehören
 * Mac IP Typ und Name des Moduls
 */
void publishNetworkSettings() {
  // über dieses Topic kommuziert das Modul mit dem Python Skript
  String prePubTopic = type + "/mac/" + macAdresse;
  char prePubTopicArray[200];
  prePubTopic.toCharArray(prePubTopicArray, 200);

  //Serial.println("[DEBUG] Topic String: " + prePubTopic);
  //Serial.println("[DEBUG] Topic Array: " + String(prePubTopicArray));

  createClientStatusJson().toCharArray(clientStatusArray, 200);

  if (mqttClient.publish(prePubTopicArray, clientStatusArray)) {
    Serial.println("[INFO] Status - Payload erfolgreich versendet.");
  } else {
    Serial.println(
        "[ERROR] Status - Payload konnte nicht versendet werden.");
  }
}

/*
 * String im JSON Format
 * wird versendet, wenn der Client die Verbindung zum Broker verliert.
 */
String createLastWillJson() {
  String lastWillPayload;
  lastWillPayload += "{";

  lastWillPayload += "\"Mac\": ";
  lastWillPayload += "\"" + macAdresse + "\", ";

  lastWillPayload += "\"Message\": ";
  lastWillPayload += "\"Verbindung verloren.\"}";

  return lastWillPayload;
}

/*
 * String im JSON Format
 * wird versendet, um den Python Skript über den Status des Clients zu informieren
 */
String createClientStatusJson() {
  String statusPayload = "{";

  statusPayload += "\"Mac\": ";
  statusPayload += "\"" + macAdresse + "\", ";

  statusPayload += "\"IP\": ";
  statusPayload += "\"" + ipAdresse.toString() + "\", ";

  statusPayload += "\"Typ\": ";
  statusPayload += "\"" + type + "\", ";

  statusPayload += "\"Name\": ";
  statusPayload += "\"" + modulName + "\"}";

  Serial.println("[DEBUG] Status-Payload als JSON: " + statusPayload);
  Serial.println();

  return statusPayload;
}

/*
 * Konfiguration der OTA Schnittstelle
 */
void initOTA() {
  // Standard Port
  ArduinoOTA.setPort(8266);
  char newNameArray[50];
  nameString.toCharArray(newNameArray, 50);
  // Name des Gerätes ist der OTA Name
  ArduinoOTA.setHostname(newNameArray);

  // OTA Passwort
  ArduinoOTA.setPassword(otaPW);

  ArduinoOTA.onStart([]() {
    Serial.println("Start");
  });
  ArduinoOTA.onEnd([]() {
    Serial.println("\nEnd");
    ESP.restart();
  });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    Serial.printf("Progress: %u%%\r", (progress / (total / 100)));
  });
  ArduinoOTA.onError(
      [](ota_error_t error) {
        Serial.printf("Error[%u]: ", error);
        if (error == OTA_AUTH_ERROR) Serial.println("[ERROR] Auth Failed");
        else if (error == OTA_BEGIN_ERROR) Serial.println("[ERROR] Begin Failed");
        else if (error == OTA_CONNECT_ERROR) Serial.println("[ERROR] Connect Failed");
        else if (error == OTA_RECEIVE_ERROR) Serial.println("[ERROR] Receive Failed");
        else if (error == OTA_END_ERROR) Serial.println("[ERROR] End Failed");
      });
}

/*
 * Prüft regelmäßig, ob Verbindung zum WLAN besteht.
 * Falls nicht wird ein reconnect durchgeführt.
 *
 * Falls WLAN verbunden, wird geprüft, ob Verbindung zum MQTT Broker steht.
 * Falls nicht wird alle 5 Sekunden ein reconnect durchgeführt
 */
void verifyConnection() {

  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
  // da wir nun sicher sind, dass wir mit dem Wlan verbunden sind,
  // kann geprüft werden, ob wir mit dem Broker verbunden sind.
  // Falls nicht führe auch hier alle 5 Sekunden einen Reconnect durch
  else {

    if (mqttClient.connected()) {
      mqttClient.loop();
    } else {
      Serial.println();
      Serial.println("[ERROR] Verbindung zum Broker getrennt.");
      long now = millis();

      if (now - lastReconnectAttempt > 5000) {
        lastReconnectAttempt = now;

        Serial.println(
            "[INFO] Versuche Verbindung zum Broker aufzubauen...");

        if (reconnectToBroker()) {

          Serial.println(
              "[INFO] Verbindung zum Broker wieder aufgebaut.");
          Serial.println();
          lastReconnectAttempt = 0;

        } else {
          Serial.println(
              "[ERROR] Verbindungsversuch fehlgeschlagen...");
        }
      }

    }

  }

}

void setup() {

  Serial.begin(115200);
  Serial.println();
  pinMode(LED0, OUTPUT);
  pinMode(LDRPIN, INPUT);
  pinMode(DHTPIN, INPUT);
  digitalWrite(LED0, !LOW);

  readConfigFromFS();
  initWifiManager();
  saveConfigParams();

  printWiFiInfo();

  setupMqtt();
  connectToBroker();
  printBrokerInfo();

  publishNetworkSettings();

  lastPublishAttempt = millis();
  Serial.println("[INFO] Warte auf Namen....");
  while (!topicUpdated) {
    verifyConnection();
    long now = millis();
    if (now - lastPublishAttempt > 10000) {
      Serial.println("[ERROR] Timeout.. Sende Netzwerkdaten erneut!.");
      Serial.println();
      lastPublishAttempt = now;
      publishNetworkSettings();
    }
  }
  Serial.println("[DEBUG] Neues Topic wurde geupdated.");
  mqttClient.unsubscribe(nameTopicArray);
  mqttClient.subscribe(finalSubTopicArray);

  initOTA();
  ArduinoOTA.begin();
  dht.begin();
  delay(2000);
  //gebe allen Timestamp den gleich Wert, um die Setupzeit irrelevant zu machen
  timestamp1 = millis();
  timestamp2 = timestamp1;
  timestamp3 = timestamp1;
}

void loop() {
  ArduinoOTA.handle();
  verifyConnection();
  //im Energiemodus falle in den deepSleep nach 3 Messungen
  if (energieModus == ECO) {
    timestamp1 = millis();
    //Prüfe, ob es schon schlafenszeit ist
    if (abs(timestamp1 - timestamp3) < messureDuration * 1000
        && !payloadSent) {
      //messe alle zwei Sekunden, solange noch nicht die sampleSize stimmt
      if (abs(timestamp1 - timestamp2) > 2000
          && messCounter < sampleSize) {
        ldrValue = analogRead(A0);
        humidity = dht.readHumidity();
        delay(250);
        temperature = dht.readTemperature();
        delay(250);
        heatIndex = dht.computeHeatIndex(temperature, humidity, false);
        delay(250);
        timestamp2 = millis();
        if (isnan(humidity) || isnan(temperature)) {
          Serial.println(
              "[ERROR] Temperatur oder Feuchtigkeit nicht messbar");
        } else {
          averageHumidity += humidity;
          averageTemperature += temperature;
          averageLdrValue += ldrValue;
          averageHeatIndex += heatIndex;
          messCounter++;
        }
      }
      //sobald wir genug Messwerte gesammelt haben, wird der Durchschnitt gebildet und versendet,
      if (messCounter == sampleSize) {
        averageHumidity = averageHumidity / 3.0;
        averageTemperature = averageTemperature / 3.0;
        averageLdrValue = averageLdrValue / 3.0;
        averageHeatIndex = averageHeatIndex / 3.0;

        String payload = "{\"identifier\":\"data\",\"temp\": "
            + String(averageTemperature) + ", \"hum\":"
            + String(averageHumidity) + ",\"ldr\":"
            + String(averageLdrValue) + ", \"hi\":"
            + String(averageHeatIndex) + "}";
        char payloadArray[200];

        payload.toCharArray(payloadArray, 200);

        if (mqttClient.publish(finalPubTopicArray, payloadArray)) {
          Serial.println(
              "[INFO] Wetter-Payload erfolgreich versendet.");
          payloadSent = true;

        } else {
          Serial.println(
              "[ERROR] Wetter-Payload konnte nicht versendet werden.");
        }
      }

    } else {
      //da Payload nun versendet wurde warten wir bis unsere Zeit abgelaufen ist
      if ((abs(timestamp1 - timestamp3) > messureDuration * 1000)) {
        ESP.deepSleep(deepSleepDuration * 1000000);
        //stand in einem Forum soo..
        delay(100);
      }
    }

  }
  //im PWR Modus sende alle 10 Sekunden Wetterdaten
  if (energieModus == PWR) {

    timestamp1 = millis();
    //messe alle 10 Sekunden
    if (abs(timestamp1 - timestamp2) > 10000) {
      ldrValue = analogRead(A0);
      humidity = dht.readHumidity();
      delay(250);
      temperature = dht.readTemperature();
      delay(250);
      heatIndex = dht.computeHeatIndex(temperature, humidity, false);
      delay(250);
      timestamp2 = millis();
      //falls Feuchtigkeit oder Temperatur nicht messbar waren, versende keine Daten
      if (isnan(humidity) || isnan(temperature)) {
        Serial.println(
            "[ERROR] Temperatur oder Feuchtigkeit nicht messbar");
      } else {

        String payload = "{\"identifier\":\"data\",\"temp\": "
            + String(temperature) + ", \"hum\":"
            + String(humidity) + ",\"ldr\":"
            + String(ldrValue) + ", \"hi\":"
            + String(heatIndex) + "}";
        char payloadArray[200];

        payload.toCharArray(payloadArray, 200);

        if (mqttClient.publish(finalPubTopicArray, payloadArray)) {
          Serial.println(
              "[INFO] Wetter-Payload erfolgreich versendet.");
          payloadSent = true;

        } else {
          Serial.println(
              "[ERROR] Wetter-Payload konnte nicht versendet werden.");
        }

      }

    }

  }

}


