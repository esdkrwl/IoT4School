import ujson
from blink import blink
from machine import I2C, Pin
import d1motor # D1-Motor Library Quelle: https://georgik.rocks/wp-content/python/d1motor.zip (Selber in Firmware eingefroren)

class Motor:
    def __init__(self, name, scl, sda, i2c_addr, mqtt_client, device_id):
        # Name des Moduls (definiert mittels BIPES)
        self.name = name
        # Verwendete i2c_addr (definiert mittels BIPES)
        self.i2c_addr = i2c_addr
        # Geräte-ID des Controllers, an den das Modul angeschlossen ist
        self.device_id = device_id
        # Typ des Moduls - Sensor oder Aktor
        self.type = "Aktor"
        # Quality of Service, mit dem ein Subscribe erfolgen soll (QoS = 0/1; 2 nicht unterstützt)
        self.qos = 1
        # Festlegen des Subscribe/Publish-Topics
        # z.B. sub/wemos1/Aktor/Motor/Brummi
        # bzw. pub/wemos1/Aktor/Motor/Brummi
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        # Zustand der Motoren (Standardmäßig ausgeschaltet)
        self.enabled_m0 = False
        self.enabled_m1 = False
        # Geschwindigkeit in % (Bereich von -100% bis 100%. Positiv = UZS, Negativ = Gegen UZS, 0 = Stillstand)
        self.speed_m0 = 100
        self.speed_m1 = 100
        
        # --- Modulsepzifische Initialisierung ---
        self.i2c = I2C(Pin(scl), Pin(sda), freq=100000)
        try:
            self.m0 = d1motor.Motor(0, self.i2c)
            self.m1 = d1motor.Motor(1, self.i2c)
        except:
            print('[ERROR] Motor Shield konnte nicht eingebunden werden. Gerät kann nicht erreicht werden.')
            self.m0 = None
            self.m1 = None
            return
        
        if self.enabled_m0 == False and self.enabled_m1 == False:
            self.set_disabled(-1)
        elif self.enabled_m0 == False:
            self.set_disabled(0)
        else:
            self.set_disabled(1)
    
    # Modul-Callback, der vom Modul Callback Handler (in der Klasse cb_handler.py) aufgerufen wird
    def callback(self, topic, msg, retain, duplicate):
        
        if self.m0 == None or self.m1 == None:
            print('[ERROR] Motor Shield konnte nicht eingebunden werden. Gerät kann nicht erreicht werden.')
            return
        
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
        
        # Motor-Index angegeben
        if 'motor_index' in json:
            if isinstance(json['motor_index'], int) and json['motor_index'] >= 0 and json['motor_index'] <= 1:
                
                if 'toggle' in json:
                    if isinstance(json['toggle'], int):
                        if json['toggle']:
                            self.toggle(json['motor_index'])
                
                if 'set_enabled' in json:
                    if json['set_enabled'] == True:
                        self.set_enabled(json['motor_index'])
                    elif json['set_enabled'] == False:
                        self.set_disabled(json['motor_index'])
                        
                if 'set_speed' in json:
                    if isinstance(json['set_speed'], int):
                        if json['set_speed'] >= -100 and json['set_speed'] <= 100:
                            self.set_speed(json['set_speed'], json['motor_index'])
                
                if 'brake' in json:
                    self.brake(json['motor_index'])
        
        # Kein Motor-Index angegeben (also werden beide angesprochen)
        else:
            if 'toggle' in json:
                if isinstance(json['toggle'], int):
                    if json['toggle']:
                        self.toggle()
            
            if 'set_enabled' in json:
                if json['set_enabled'] == True:
                    self.set_enabled()
                elif json['set_enabled'] == False:
                    self.set_disabled()
                    
            if 'set_speed' in json:
                if isinstance(json['set_speed'], int):
                    if json['set_speed'] >= -100 and json['set_speed'] <= 100:
                        self.set_speed(json['set_speed'])
            
            if 'brake' in json:
                    self.brake()
                                
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "enabled": [{}, {}], "speed": [{}, {}]}}'\
              .format('true' if self.enabled_m0 else 'false', 'true' if self.enabled_m1 else 'false',
                      self.speed_m0, self.speed_m1)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
        
    
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    def toggle(self, motor_index = -1):
        if motor_index == -1:
            if self.enabled_m0 == True:
                self.set_disabled(0)
            else:
                self.set_enabled(0)
            if self.enabled_m1 == True:
                self.set_disabled(1)
            else:
                self.set_enabled(1)
        else:
            if motor_index == 0:
                if self.enabled_m0 == True:
                    self.set_disabled(0)
                else:
                    self.set_enabled(0)
            elif motor_index == 1:
                if self.enabled_m1 == True:
                    self.set_disabled(1)
                else:
                    self.set_enabled(1)
    
    # Funktion, die den Motor anschaltet
    # Startet die Motoren mit ihrem in einer internen Variable gespeicherten Speed-Wert
    def set_enabled(self, motor_index = -1):
        if motor_index == -1:
            #print('[INFO] Schalte beide Motoren an.')
            self.enabled_m0 = True
            self.enabled_m1 = True
            self.set_speed(self.speed_m0, 0)
            self.set_speed(self.speed_m1, 1)
            
        else:
            #print('[INFO] Schalte Motor mit Index {} an.'.format(motor_index)) 
            if motor_index == 0:
                self.enabled_m0 = True
                self.set_speed(self.speed_m0, 0)
            elif motor_index == 1:
                self.enabled_m1 = True
                self.set_speed(self.speed_m1, 1)
    
    # Funktion, die den Motor ausschaltet, indem die Geschwindigkeit auf 0 gesetzt (aber nicht gespeichert) wird
    def set_disabled(self, motor_index = -1):
        if motor_index == -1:
            print('[INFO] Schalte beide Motoren aus.')
            self.enabled_m0 = False
            self.enabled_m1 = False
            self.m0.speed(0)
            self.m1.speed(0)
        else:
            print('[INFO] Schalte Motor mit Index {} aus.'.format(motor_index)) 
            if motor_index == 0:
                self.enabled_m0 = False
                self.m0.speed(0)
            elif motor_index == 1:
                self.enabled_m1 = False
                self.m1.speed(0)
        
    # Funktion, um die Geschwindigkeit der Motoren festzulegen
    # Default für beide Motoren, ansonsten muss der entsprechende Index als Zahl übergeben werden
    def set_speed(self, speed, motor_index = -1):
        if motor_index == -1:
            print('[INFO] Setze Geschwindigkeit beider Motoren auf {}%.'.format(speed))
            self.enabled_m0 = True
            self.enabled_m1 = True
            self.speed_m0 = speed
            self.speed_m1 = speed
            self.m0.speed(speed*100)
            self.m1.speed(speed*100)
        else:
            print('[INFO] Setze Geschwindigkeit von Motor mit Index {} auf {}%.'.format(motor_index,speed))
            if motor_index == 0:
                self.enabled_m0 = True
                self.speed_m0 = speed
                self.m0.speed(speed*100)
            elif motor_index == 1:
                self.enabled_m1 = True
                self.speed_m1 = speed
                self.m1.speed(speed*100)       
    
    # Funktion, die den Motor abrupt stoppen lässt, anstatt diesen "ausrollen zu lassen" 
    def brake(self, motor_index = -1):
        if motor_index == -1:
            print('[INFO] HALT STOP!! Beide Motoren werden sofort gebremst.')
            self.m0.brake()
            self.m1.brake()
            self.speed_m0 = 0
            self.speed_m1 = 0
            self.enabled_m0 = False
            self.enabled_m1 = False
        else:
            print('[INFO] HALT STOP!! Motor mit dem Index {} wird sofort gebremst.'.format(motor_index))
            if motor_index == 0:
                self.m0.brake()
                self.speed_m0 = 0
                self.enabled_m0 = False
            elif motor_index == 1:
                self.m1.brake()
                self.speed_m1 = 0
                self.enabled_m1 = False