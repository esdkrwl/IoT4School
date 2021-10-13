# Die Funktion zum Auslesen der Temperatur/Feuchtigkeit über die I2C-Adresse, sind Teil von
# https://github.com/HAIZAKURA/esp-sht3x-micropython Copyright (c) 2020 HAIZAKURA

import ujson
from blink import blink
from machine import I2C, Pin
import utime

class SHT3x:
    def __init__(self, name, scl, sda, i2c_addr, mqtt_client, device_id):
        # Name des Moduls (festgelegt mittels BIPES)
        self.name = name
        # Verwendeter PIN (festgelegt mittels BIPES)
        self.i2c_addr = i2c_addr
        # Geräte-ID des Controllers, an den das Modul angeschlossen ist
        self.device_id = device_id
        # Typ des Moduls - Sensor oder Aktor
        self.type = "Sensor"
        # Quality of Service, mit dem ein Subscribe erfolgen soll (QoS = 0/1; 2 nicht unterstützt)
        self.qos = 1
        # Festlegen des Subscribe/Publish-Topics
        # z.B. sub/wemos1/Sensor/SHT3x/Tempi
        # bzw. pub/wemos1/Sensor/SHT3x/Tempi
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
        self.i2c = I2C(Pin(scl), Pin(sda), freq=100000)
    
    # Modul-Callback, der vom Modul Callback Handler (in der Klasse cb_handler.py) aufgerufen wird
    def callback(self, topic, msg, retain, duplicate):
        print('[INFO] {}-Modul {} hat die Daten vom Callback-Handler erhalten. (Addresse des Moduls: {})'\
              .format(type(self).__name__, self.name, hex(self.i2c_addr)))
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
            self.last_measure = self.current_measure
            if self.enabled:
                print('[DEBUG] Messung wird durchgeführt!')
                try:
                    status = self.i2c.writeto(self.i2c_addr,b'\x24\x00')
                    utime.sleep(1)
                    databytes = self.i2c.readfrom(self.i2c_addr, 6)
                    temperature_raw = databytes[0] << 8 | databytes[1]
                    humidity_raw = databytes[3] << 8  | databytes[4]
                    self.temperature = int((175.0 * float(temperature_raw) / 65535.0) - 45)
                    self.humidity = int(100.0 * float(humidity_raw) / 65535.0)
                except OSError:
                    print('[ERROR] Messung nicht möglich. Gerät kann nicht erreicht werden.')
                msg = '{{"identifier": "data", "temperature": {}, "humidity": {}}}'\
                      .format(self.temperature, self.humidity)
                # Argumente: Topic, Message, Retain, QoS
                if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
                    print('[INFO] SHT Payload erfolgreich versendet.')
                    print(msg)
                else:
                    print('[ERROR] SHT Payload nicht versendet.')
        
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    # Funktion, die den SHT-Sensor aktiviert
    def set_enabled(self):
        print('[INFO] Schalte SHT an.')
        self.enabled = True 
    
    # Funktion, die den SHT-Sensor deaktiviert
    def set_disabled(self):
        print('[INFO] Schalte SHT aus.')
        self.enabled = False
        
    def set_debounce_time(self, debounce_time):
        print('[INFO] Setze Dauer zwischen zwei Messungen auf mindestens {} Sekunden.'.format(debounce_time))
        self.debounce_time = debounce_time
        
    def get_temperature(self):
        return self.temperature
    
    def get_humidity(self):
        return self.humidity
        
