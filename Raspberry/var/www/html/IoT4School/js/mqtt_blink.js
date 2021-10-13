// Bei jedem neuen Seitenaufruf wird eine neue, zuf‰llige MQTT_Client_ID generiert
  var MQTT_CLIENT_ID = "iot4school_web_"+Math.floor((1 + Math.random()) * 0x10000000000).toString(16);
  var MQTT_CLIENT_PORT = 9001;
  var MQTT_CLIENT_HOST = window.location.hostname;

// Erstellen einer MQTT Client Instanz
  var MQTT_CLIENT = new Paho.MQTT.Client(window.location.hostname, MQTT_CLIENT_PORT, MQTT_CLIENT_ID);

// Versuch sich mit dem Websocket des MQTT Brokers zu verbinden
  MQTT_CLIENT.connect({ onSuccess: onConnect, onFailure: onFailure });

// Diese Funktion hinterlegt findMyDevice() auf den Klick der Buttons
function onConnect() {
  console.log('Verbindung zum MQTT-Client ' + MQTT_CLIENT_HOST + ':' + MQTT_CLIENT_PORT + ' erfolgreich! :)');
  $(document).on('click', ".blink-button", findMyDevice);
}

// Diese Funktion hinterlegt errorMessage() auf den Klick der Buttons
function onFailure() {
  console.log('MQTT Client nicht mit dem Broker verbunden...');
  $(document).on('click', ".blink-button", errorMessage);
}

// Diese Funktion wird hinterlegt, wenn keine Verbindung zum Broker hergestellt werden konnte
// Teilt dem User per Pop-Up mit, dass keine Verbindung zum Broker hergestellt werden konnte
function errorMessage() {
  alert('Verbindung zum MQTT-Client ' + MQTT_CLIENT_HOST + ':' + MQTT_CLIENT_PORT + ' fehlgeschlagen.. :(' +
  ' Pr√ºfe die Einstellungen der mqtt.js oder der mosquitto.conf.');
}

function findMyDevice() {
  var $row = $(this).closest("tr");    // Finde Reihe des Buttons
  var $id = $row.find(".id").text(); // Finde die ID in der Reihe des Buttons
  var $mac = $row.find(".mac").text(); // Finde die MAC in der Reihe des Buttons
  var $status = $row.find(".status").text(); // Finde den Verbindungsstatus in der Reihe des Buttons
  
  if ($status == 'Verbunden') {
    
    console.log("Blink-Nachricht an " + $id + " mit MAC-Adresse: " + $mac + " versandt.");
    
    // Erstelle neue MQTT Nachricht mit der MAC-Adresse als Payload
    var mqttMessage = new Paho.MQTT.Message($mac);
    // Topic ist sub/Ger‰te-ID, also z.B. sub/wemos1
    mqttMessage.destinationName = "sub/" + $id;
    // Versenden der Nachricht
    MQTT_CLIENT.send(mqttMessage);
  
  } else {
    alert('Das Ger√§t mit der MAC-Adresse: ' + $mac + ' ist nicht mit dem Broker verbunden und l√§sst sich daher nicht anblinken.');
  }
}