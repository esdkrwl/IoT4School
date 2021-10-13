import ujson
from blink import blink
from machine import Pin
# Hier könnten Ihre Imports stehen

class Klassenname:
    def __init__(self, name, pin, mqtt_client, device_id):
        # Name des Moduls (definiert mittels BIPES)
        self.name = name
        # Verwendeter PIN (definiert mittels BIPES)
        self.pin = pin
        # self.i2c_addr = i2c_addr (falls I2C-Gerät)
        # Geräte-ID des Controllers, an den das Modul angeschlossen ist
        self.device_id = device_id
        # Typ des Moduls - Sensor oder Aktor
        self.type = "Aktor"
        # Quality of Service, mit dem ein Subscribe erfolgen soll (QoS = 0/1; 2 nicht unterstützt)
        self.qos = 1
        # Festlegen des Subscribe/Publish-Topics
        # z.B. sub/wemos1/Aktor/Klassenname/Blaudruck
        # bzw. pub/wemos1/Aktor/Klassenname/Blaudruck
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        
        # --- Modulsepzifische Initialisierung ---
    
    # Modul-Callback, der vom Modul Callback Handler (in der Klasse cb_handler.py) aufgerufen wird
    def callback(self, topic, msg, retain, duplicate):
        print('[INFO] {}-Modul {} hat die Daten vom Callback-Handler erhalten. (Pin des Moduls: GPIO {})'\
              .format(type(self).__name__, self.name, self.pin))
        
        # Falls es sich um ein I2C-Gerät handelt
        #print('[INFO] {}-Modul {} hat die Daten vom Callback-Handler erhalten. (Addresse des Moduls: {})'\
        #      .format(type(self).__name__, self.name, hex(self.i2c_addr)))
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
                                
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    # Hier könnten ihre Funktionen stehen, die vom JSON-Teil aufgerufen werden, aber
    # auch direkt in BIPES realisiert werden können
        
                