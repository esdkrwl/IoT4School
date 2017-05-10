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

//Board-LED
#define       LED0      2
#define       PIR_PIN       10

// Typ des Moduls - Sensor oder Aktor
String type = "Sensor";
// Name des Moduls - z.B. RGB-LED, Smart-Button etc..
String modulName = "PIR";

// ------ HIER RELEVANTER MODUL PARAMETER SAMMELN ------
//komplatibel zu set_pwr. Statt anschalten alarm aktivieren. Wenn deaktiviert, sendet der Sensor nichts mehr.
enum alarm { ON, OFF};
int alarmModus = ON;
// erst nach 10 Sekunden wieder Bewegung feststellen
int debounceTime = 10000;

//Zeitstempel
long currentAlarm = 0;
long lastAlarm = 0;

//Alarmzähler
long alarmCounter = 0;
// -----------------------------------------------------


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
	StaticJsonBuffer<200> jsonBuffer;
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
  
  if(j.containsKey( "new_name" )){
    String newName = j["new_name"];
    nameString = newName;
  }
  if(j.containsKey("suffix")){
    String suffix = j["suffix"];
    
    String finalSubTopic = "sub/"+ type +"/"+modulName+"/"+suffix;
    String finalPubTopic = "pub/"+ type +"/"+modulName+"/"+suffix;
    
    finalPubTopic.toCharArray(finalPubTopicArray, 200);
    finalSubTopic.toCharArray(finalSubTopicArray, 200);
    Serial.println("[DEBUG] Final Sub Topic: " + String(finalSubTopicArray));
    Serial.println("[DEBUG] Final Pub Topic: " + String(finalPubTopicArray));
  }
  topicUpdated = true;

}
/*
 * Callback Methode, falls der Identifier Config im Payload gefunden wurde
 */
void onConfig(JsonObject& j) {
	Serial.println("[DEBUG] Greetz aus onConfig");

}

/*
 * Callback Methode, falls der Identifier Data im Payload gefunden wurde
 */
void onData(JsonObject& j) {
	Serial.println("[DEBUG] Greetz aus onData");
	String test = j["b"];
	Serial.println(test);

}

/*
 * Callback Methode, falls der Identifier Status im Payload gefunden wurde
 */
void onStatus(JsonObject& j) {
	Serial.println("[DEBUG] Greetz aus onStatus");

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

	if(setReset){
	  wifiManager.resetSettings();
	}
	wifiManager.setTimeout(180);
  
	if (!wifiManager.autoConnect("IoT2School", "IoT-PW")) {
		Serial.println("failed to connect and hit timeout");
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
      //file exists, reading and loading
      Serial.println("[INFO] Lade Config Datei...");
      File configFile = SPIFFS.open("/config.json", "r");
      if (configFile) {
        size_t size = configFile.size();
        // Allocate a buffer to store contents of the file.
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
			Serial.print("[ERROR] Verbindung zum Broker fehlgeschlagen. Fehlercode: ");
			Serial.println(mqttClient.state());
			delay(5000);
      mqttStrikes++;
		}
    /*
     * Falls sich nach dem dritten Versuch nicht mit dem Broker verbunden werden konnte,
     * wird der Webserver erneut gestartet
     * dort kann man nochmal die Parameter für den Broker überprüfen
     */
   if(mqttStrikes == 3){
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
      WiFiManagerParameter custom_mqtt_port("port", "mqtt port", mqtt_port, 5);
    
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
      mqttClient.setServer(custom_mqtt_server.getValue(), atoi(custom_mqtt_port.getValue()));
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
	ArduinoOTA.setPassword((const char *) "123");

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
	ArduinoOTA.onError([](ota_error_t error) {
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

/*void motionDetected(){
  currentAlarm = millis();
  
  if(abs(lastAlarm - currentAlarm) > debounceTime && alarmModus==ON){
  
      lastAlarm = currentAlarm;
      
      String payload = "{\"identifier\":\"data\",\"motionDetected\":true}";
      char payloadArray[200];
      payload.toCharArray(payloadArray, 200);
      
      if (mqttClient.publish(finalPubTopicArray, payloadArray)) {
        Serial.println("[INFO] Alarm-Payload erfolgreich versendet.");
        alarmCounter++;
      } else {
        Serial.println("[ERROR] Alarm-Payload konnte nicht versendet werden.");
    }   
  }
}*/

void setup() {

	Serial.begin(115200);
	Serial.println();
  pinMode(PIR_PIN, INPUT);
  digitalWrite(PIR_PIN, LOW);
	pinMode(LED0, OUTPUT);
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
  while(!topicUpdated){
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

  //attachInterrupt(digitalPinToInterrupt(PIR_PIN), motionDetected, RISING);
  
}

void loop() {
  ArduinoOTA.handle();
	verifyConnection();
  currentAlarm = millis();
  if(digitalRead(PIR_PIN)){
    if(abs(lastAlarm - currentAlarm) > debounceTime && alarmModus==ON){
    
        lastAlarm = currentAlarm;
        
        String payload = "{\"identifier\":\"data\",\"motionDetected\":true}";
        char payloadArray[200];
        payload.toCharArray(payloadArray, 200);
        
        if (mqttClient.publish(finalPubTopicArray, payloadArray)) {
          Serial.println("[INFO] Alarm-Payload erfolgreich versendet.");
          alarmCounter++;
        } else {
          Serial.println("[ERROR] Alarm-Payload konnte nicht versendet werden.");
      }   
    }
    
  }


 
}
