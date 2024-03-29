import ujson
from blink import blink
from machine import Pin
import utime
import dht # Library ist Bestandteil von Micropython

class DHT:
    def __init__(self, name, pin, dht_type, mqtt_client, device_id):
        # Name des Moduls (festgelegt mittels BIPES)
        self.name = name
        # Verwendeter PIN (festgelegt mittels BIPES)
        self.pin = pin
        # Geräte-ID des Controllers, an den das Modul angeschlossen ist
        self.device_id = device_id
        # Typ des Moduls - Sensor oder Aktor
        self.type = "Sensor"
        # Quality of Service, mit dem ein Subscribe erfolgen soll (QoS = 0/1; 2 nicht unterstützt)
        self.qos = 1
        # Festlegen des Subscribe/Publish-Topics
        # z.B. sub/wemos1/Sensor/DHT/Tempi
        # bzw. pub/wemos1/Sensor/DHT/Tempi
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        #  Zustand des Temperatursensors (Standardmäßig ausgeschaltet)
        self.enabled = False
        # Zeit (in s), die zwischen zwei Messungen abgelaufen sein muss, bis erneut eine Messung durchgeführt wird 
        self.debounce_time = 10
        # Zeitstempel getätigter Messungen
        self.current_measure = 0
        self.last_measure = 0
        # Messwerte des Sensors (Temperatur in °C / Feuchtigkeit in %)
        self.temperature = 0
        self.humidity = 0
        
        # --- Modulsepzifische Initialisierung ---
        if dht_type == 'dht11':
            self.dht = dht.DHT11(Pin(pin))
        elif dht_type == 'dht22':
            self.dht = dht.DHT22(Pin(pin))
    
    # Modul-Callback, der vom Modul Callback Handler (in der Klasse cb_handler.py) aufgerufen wird
    def callback(self, topic, msg, retain, duplicate):
        print('[INFO] {}-Modul {} hat die Daten vom Callback-Handler erhalten. (Pin des Moduls: GPIO {})'\
              .format(type(self).__name__, self.name, self.pin))
        try:
            root = ujson.loads(msg)
        except ValueError:
            print('[ERROR] JSON Parsing fehlgeschlagen..')
            return
        
        # Hier wird auf Identifier in der geparsten JSON geprüft
        # config: Enthält in der Nachricht neue Stellwerte für die internen Variablen des Moduls
        # data: Daten, die einen Aktor steuern können (z.B. Messdaten von einem Sensor)
        # status: Fordert das Modul auf, seine internen Variablen zu publishen
        if 'identifier' in root:
            if root['identifier'] == 'config':
                self.on_config(root)
            elif root['identifier'] == 'data':
                self.on_data(root)
            elif root['identifier'] == 'status':
                self.on_status(root)
            else:
                print('[ERROR] Unbekannter Identifier: {}'.format(root['identifier']))
        else:
            print('[ERROR] Keinen Identifier gefunden.')
    
    # Callback-Methode, falls der Identifier config im Payload gefunden wurde
    def on_config(self, json):
        print('[DEBUG] Identifier config im Payload gefunden.')
        if 'set_enabled' in json:
            if json['set_enabled'] == True:
                self.set_enabled()
            if json['set_enabled'] == False:
                self.set_disabled()
        
        if 'set_debounce_time' in json:
            if isinstance(json['set_debounce_time'], int):
                if json['set_debounce_time'] > 0 and json['set_debounce_time'] <= 3600:
                    self.set_debounce_time(json['set_debounce_time'])
        
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "enabled": {}, "debounce_time": {}, "temperature": {}, "humidity": {}}}'\
              .format('true' if self.enabled else 'false', self.debounce_time, self.temperature, self.humidity)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
    
    # Funktion, die nach Prüfung auf Ablauf der debounce_time Temperatur und Feuchtigkeit misst und als Payload versendet
    # (wird von der main.py im Loop aufgerufen)
    def check(self):
        self.current_measure = utime.ticks_ms()
        if utime.ticks_diff(self.current_measure, self.last_measure) >= (self.debounce_time*1000) and self.enabled:
            # Da Messung nur alle 2 Sekunden möglich für DHT22, 1 Sekunde warten, falls debounce_time kleiner 2
            if self.debounce_time < 2 and type(self.dht).__name__ == 'DHT22':
                utime.sleep_ms(1000)
            self.last_measure = self.current_measure
            print('[DEBUG] Messung wird durchgeführt!')
            try:
                self.dht.measure()
            except OSError:
                print('[ERROR] Messung nicht möglich. Gerät kann nicht erreicht werden.')
            self.temperature = int(self.dht.temperature())
            self.humidity = int(self.dht.humidity())
            # Workaround, falls DHT11 / DHT22 auf GPIO2 (bzw. PIN4), da sonst die LED nach Messung ausgeht 
            if self.pin == 2:
                Pin(self.pin).off()
            msg = '{{"identifier": "data", "temperature": {}, "humidity": {}}}'\
                  .format(self.temperature, self.humidity)
            # Argumente: Topic, Message, Retain, QoS
            if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
                print('[INFO] DHT Payload erfolgreich versendet.')
                print(msg)
            else:
                print('[ERROR] DHT Payload nicht versendet.')
        
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    # Funktion, die den DHT-Sensor aktiviert
    def set_enabled(self):
        print('[INFO] Schalte DHT an.')
        self.enabled = True 
    
    # Funktion, die den DHT-Sensor deaktiviert
    def set_disabled(self):
        print('[INFO] Schalte DHT aus.')
        self.enabled = False
        
    def set_debounce_time(self, debounce_time):
        print('[INFO] Setze Dauer zwischen zwei Messungen auf mindestens {} Sekunden.'.format(debounce_time))
        self.debounce_time = debounce_time
        
    def get_temperature(self):
        return self.temperature
    
    def get_humidity(self):
        return self.humidity
        
