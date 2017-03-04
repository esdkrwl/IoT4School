#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <Arduino.h>

#define       LED0      2

const char* ssid = "Thunfisch";
const char* pw = "qwertz123";

IPAddress mqttServer(192, 168, 178, 123);
int mqttServerPort = 1883;

String type = "Sensor";
String modulName = "LDR";

String essid = "";
IPAddress ipAdresse;
String macAdresse = String(WiFi.macAddress());
long signalQuali = 0;
int espStatus = 0;

bool topicUpdated = false;

String lastWillTopic = "esp/lastwill/mac/" + macAdresse;
char lastWillTopicArray[100];
String lastWillPayload = "";
char lastWillPayloadArray[100];


WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

String nameClientTopic = "nameClient/"+type+"/mac/" + macAdresse;
char nameTopicArray[100];

String prePubTopic = "esp/sensor/mac/" + macAdresse;

String finalPubTopic = "esp/"+type+"/";
char finalPubTopicArray[100];

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("[Info] Daten erhalten. Topic: ");
  Serial.print(topic);
  Serial.print(", Payload: ");
  for (unsigned int i = 0; i < length; i++) {
    Serial.print((char) payload[i]);
  }
  Serial.println();

  if(length == modulName.length() + 1){
    modulName = "";
    for(int i = 0; i < length; i++){
      modulName += (char)payload[i];
    }
    finalPubTopic += modulName;
    finalPubTopic.toCharArray(finalPubTopicArray, 100);
    Serial.println("[Debug] Final Topic: " + String(finalPubTopicArray));
    topicUpdated = true;
  }
  if(length == modulName.length() + 2){
    finalPubTopic += (char)payload[1];
    finalPubTopic.toCharArray(finalPubTopicArray, 100);
    Serial.println("[Debug] Final Topic: " + finalPubTopic);
    topicUpdated = true;
  }
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

void reconnectToWiFi() {
  Serial.println("[ERROR] Verbindung zum WiFi verloren.");

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
  
  Serial.println("[INFO] Verbinde mit MQTT Broker.");
  while (!mqttClient.connected()) {
    Serial.print(".");
    if (mqttClient.connect("ESP8266Client", lastWillTopicArray, 1, false, lastWillPayloadArray)) {

          mqttClient.subscribe(nameTopicArray);

    } else {
      Serial.print("[ERROR] Verbindung zum fehlgeschlagen. Fehlercode: ");
      Serial.print(mqttClient.state());
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

void reconnectToBroker() {
  Serial.println("[ERROR] Verbindung zum MQTT Broker verloren.");
  while (!mqttClient.connected()) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (mqttClient.connect("ESP8266Client")) {
      Serial.println("connected");
      // Once connected, publish an announcement...
      mqttClient.publish("outTopic", "hello world");
      // ... and resubscribe
      mqttClient.subscribe("inTopic");
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 5 seconds");
      // Wait 5 seconds before retrying
      delay(5000);
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


}

void loop() {
  mqttClient.loop();

  if(topicUpdated){
    Serial.println("[DEBUG] Neues Topic wurde geupdated." );
    mqttClient.unsubscribe(nameTopicArray);
    mqttClient.subscribe(finalPubTopicArray);
    topicUpdated = false;
  }


}

