import ujson
from blink import blink
from machine import Pin
import utime

class PIR:
    def __init__(self, name, pin, mqtt_client, device_id):
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
        # z.B. sub/wemos1/Sensor/PIR/Bewegi
        # bzw. pub/wemos1/Sensor/PIR/Bewegi
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        
        #  Zustand des Bewegungsmelders (Standardmäßig ausgeschaltet)
        self.enabled = False
        # Zeit (in s), die nach einer erkannten Bewegung vorbeigehen muss, bis erneut ein Alarm durch Bewegung ausgelöst wird 
        self.debounce_time = 10
        # Zeitstempel ausgelöster Alarme
        self.current_alarm = 0
        self.last_alarm = 0
        # Alarmzähler (Nach Reboot/Reset wieder auf 0)
        self.total_alarms = 0;
        
        # --- Modulsepzifische Initialisierung ---
        self.pir = Pin(self.pin, Pin.IN)
    
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
        
        if 'reset_total_alarms' in json:
            self.reset_total_alarms()
        
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "enabled": {}, "debounce_time": {}, "total_alarms": {}}}'\
              .format('true' if self.enabled else 'false', self.debounce_time, self.total_alarms)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
    
    # Funktion, die prüft, ob eine Bewegung erkannt wurde und einen entsprechenden Payload versendet
    # (wird von der main.py im Loop aufgerufen)
    def check(self):
        if self.pir():
            self.current_alarm = utime.ticks_ms()
            if utime.ticks_diff(self.current_alarm, self.last_alarm) >= (self.debounce_time*1000) and self.enabled:
                self.last_alarm = self.current_alarm
                print('[DEBUG] Bewegung erkannt!')
                self.total_alarms += 1
                msg = '{"identifier": "data", "motion_detected": true}'
                # Argumente: Topic, Message, Retain, QoS
                if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
                    print('[INFO] Alarm Payload erfolgreich versendet.')
                else:
                    print('[ERROR] Alarm Payload nicht versendet.')
        
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    # Funktion, die den Alarm aktiviert
    def set_enabled(self):
        print('[INFO] Schalte PIR an.')
        self.enabled = True 
    
    # Funktion, die den Alarm deaktiviert
    def set_disabled(self):
        print('[INFO] Schalte PIR aus.')
        self.enabled = False
        
    def set_debounce_time(self, debounce_time):
        print('[INFO] Setze Sperrzeit für zwischen zwei erkannten Bewegungen auf {} Sekunden.'.format(debounce_time))
        self.debounce_time = debounce_time
    
    def reset_total_alarms(self):
        print('[INFO] Setze den Counter für die Anzahl ausgelöster Alarme auf 0 zurück.')
        self.total_alarms = 0
    
    def get_total_alarms(self):
        return self.total_alarms