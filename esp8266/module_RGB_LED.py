import ujson
from blink import blink
from machine import Pin
import neopixel # NeoPixel-Library mittlerweile fester Bestandteil von Micropython (In Firmware eingefroren)

class RGB_LED:
    def __init__(self, name, pin, num_led, mqtt_client, device_id):
        # Name des Moduls (definiert mittels BIPES)
        self.name = name
        # Verwendeter PIN (definiert mittels BIPES)
        self.pin = pin
        # Geräte-ID des Controllers, an den das Modul angeschlossen ist
        self.device_id = device_id
        # Typ des Moduls - Sensor oder Aktor
        self.type = "Aktor"
        # Quality of Service, mit dem ein Subscribe erfolgen soll (QoS = 0/1; 2 nicht unterstützt)
        self.qos = 1
        # Festlegen des Subscribe/Publish-Topics
        # z.B. sub/wemos1/Aktor/RGB_LED/Leuchti
        # bzw. pub/wemos1/Aktor/RGB_LED/Leuchti
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        # Zustand der Lampe (Standardmäßig ausgeschaltet)
        self.enabled = False
        # Anzahl der LEDs auf dem Modul (definiert mittels BIPES)
        self.num_led = num_led
        # Farbwerte Rot, Grün und Blau für die LEDs
        # Angabe als Liste, um das Ändern der Farbwerte für einzelne LEDs zu unterstützen
        self.red_value = []
        self.green_value = []
        self.blue_value = []
        # Helligkeit in % (Standardmäßig 100%)
        self.brightness = 100
        
        # Standardmäßig werden alle LEDs auf die "IoT4School"-Farbe gesetzt
        for i in range(0, self.num_led):
            self.red_value.append(0)
            self.green_value.append(177)
            self.blue_value.append(193)
        
        # --- Modulsepzifische Initialisierung ---
        self.rgbLeds = neopixel.NeoPixel(Pin(self.pin, Pin.OUT), self.num_led)
        
        if self.enabled == False:
            self.set_disabled()
        else:
            self.set_enabled()
    
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
        if 'toggle' in json:
            self.toggle()
        
        if 'set_enabled' in json:
            if json['set_enabled'] == True:
                self.set_enabled()
            elif json['set_enabled'] == False:
                self.set_disabled()
        
        if 'set_rgb' in json:
            rgb_list = []
            if len(json['set_rgb']) == 3:
                for i, element in enumerate(json['set_rgb']):
                    if isinstance(json['set_rgb'][i], int):
                        if json['set_rgb'][i] >= 0 and json['set_rgb'][i] <= 255:
                           rgb_list.append(json['set_rgb'][i])
                if len(rgb_list) == len(json['set_rgb']):
                    self.enabled == True
                    self.set_color(rgb_list[0], rgb_list[1], rgb_list[2])
        
        if 'set_brightness' in json:
            if isinstance(json['set_brightness'], int):
                if json['set_brightness'] >= 0 and json['set_brightness'] <= 100:
                    self.set_brightness(json['set_brightness'])
    
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "enabled": {}, "num_led": {}, "red_value": {}, "green_value": {}, "blue_value": {}, "brightness": {}}}'\
              .format('true' if self.enabled else 'false', self.num_led, self.red_value, self.green_value, self.blue_value, self.brightness)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
        
    
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    def toggle(self):
        if self.enabled == True:
            self.set_disabled()
        else:
            self.set_enabled()
    
    # Funktion, die die LED anschaltet
    # Nutzt die interne Variable brightness, um die LEDs mit der zuletzt definiertem Helligkeit einzuschalten
    def set_enabled(self):
        print('[INFO] Schalte RGB_LED an.')
        self.enabled = True 
        self.set_brightness(self.brightness)
    
    # Funktion, die die LED ausschaltet, indem alle Farbwerte auf 0 gesetzt, aber nicht gespeichert, werden 
    def set_disabled(self):
        for i in range(0, self.num_led):
            self.rgbLeds[i] = (0, 0, 0)
        print('[INFO] Schalte RGB_LED aus.')
        self.enabled = False
        self.rgbLeds.write()
        
    # Funktion, um die Farbe der RGB_LEDs zu setzen
    # Default für alle LEDs, ansonsten muss die entsprechende LED als Zahl übergeben werden
    def set_color(self, red_value, green_value, blue_value, led = 'all'):
        if led == 'all':
            for i in range(0, self.num_led):
                self.red_value[i] = red_value
                self.green_value[i] = green_value
                self.blue_value[i] = blue_value
                
                self.rgbLeds[i] = (self.red_value[i], self.green_value[i], self.blue_value[i])
                
                self.enabled = True
                self.rgbLeds.write()
        
        # Wenn LED als Zahl übergeben, muss der Wert zwischen 0 und (Anzahl der auf dem Modul verfügbaren LEDs - 1) sein
        elif led >= 0 and led <= (self.num_led - 1):
            self.red_value[led] = red_value
            self.green_value[led] = green_value
            self.blue_value[led] = blue_value
            
            self.rgbLeds[led] = (self.red_value[led], self.green_value[led], self.blue_value[led])
            
            self.enabled = True
            self.rgbLeds.write()
        else:
            print('[ERROR] Ungültige Angabe der LED. Muss zwischen 0 und {} sein.'.format(self.num_led - 1))
    
    # Helligkeit RGB-Farbmodell entspricht 0 (aus) - 255 (maximale Helligkeit) jeweils für R, G und B.
    # Umrechnung in Prozent, wobei 1% = 2,55 - 100% = 255.
    # Ergebnis wird so gut es geht approximiert
    def set_brightness(self, brightness):
        self.brightness = brightness
        red_value = []
        green_value = []
        blue_value = []
        for i in range(0, self.num_led):
            red_value.append(round(brightness * self.red_value[i] / 100))
            green_value.append(round(brightness * self.green_value[i] / 100))
            blue_value.append(round(brightness * self.blue_value[i] / 100))
            self.rgbLeds[i] = (red_value[i], green_value[i], blue_value[i])
        print('[INFO] Setze Helligkeit der RGB_LED auf {}%.'.format(brightness))
        self.rgbLeds.write()
        
                