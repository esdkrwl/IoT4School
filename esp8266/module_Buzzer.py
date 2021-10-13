from blink import blink
from machine import Pin, PWM
import songs # Kollektion einiger Beispiellieder (Quelle: https://github.com/dhylands/upy-rtttl)
import rtttl # Quelle: http://www.bipes.net.br/beta2/ui/pylibs/rtttl.py
import ujson
import time

class Buzzer:
    def __init__(self, name, pin, mqtt_client, device_id):
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
        # z.B. sub/wemos1/Aktor/Buzzer/Lightyear
        # bzw. pub/wemos1/Aktor/Buzzer/Lightyear
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        # Umgerechneter Lautstärke-Wert des Buzzers (0 ist aus, 100 ist maximale Lautstärke. Siehe Funktion play_tone.)
        self.volume = 50
        
        
        # --- Modulsepzifische Initialisierung ---
    
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
        if 'set_volume' in json:
            if isinstance(json['set_volume'], int):
                if json['set_volume'] >= 0 and json['set_volume'] <= 100:
                    self.set_volume(json['set_volume'])
        
        if 'play_tone' in json:
            if isinstance(json['play_tone'], int):
                if json['play_tone'] >= 1 and json['play_tone'] <= 1000:
                    self.play_tone(json['play_tone'])
                
        if 'play_song' in json:
            if isinstance(json['play_song'], str):
                self.play_song(json['play_song'])
        
        if 'play_song_from_file' in json:
            if isinstance(json['play_song_from_file'], str):
                self.play_song_from_file(json['play_song_from_file'])
    
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
            
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "volume": {}}}'\
              .format(self.volume)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
        
    
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    # Funktion, die die Lautstärke des Buzzers setzt und damit den Buzzer wieder aktiviert
    def set_volume(self, volume):
        print('[INFO] Setze Lautstärke auf {}%.'.format(volume))
        self.volume = volume

    # Funktion, um einen Ton in einer bestimmten Frequenz (freqc) sowie einer bestimmten Dauer (msec) wiederzugeben
    # Lautstärke des Buzzers mithilfe des Duty Cycles gesetzt. 0 (aus) - 512 (maximale Lautstärke).
    # Umrechnung in Prozent, wobei 1% = 5,12 - 100% = 512.
    # Ergebnis wird so gut es geht approximiert
    def play_tone(self, freqc, msec=1000):
        volume = round(self.volume * 5.12)
        msec = msec * 0.001
        if freqc > 0:
            pwm0 = PWM(Pin((self.pin), Pin.OUT), freq=freqc, duty=volume)
        time.sleep(msec*0.9)
        if freqc > 0:
            pwm0.deinit()
        time.sleep(msec*0.1)
    # Funktion, die als Übergabewert einen RTTTL-String akzeptiert und diesen abspielt
    def play_song(self, tune):
        tune = rtttl.RTTTL(tune)
        if type(tune) is not list:
            print('[ERROR] RTTTL String ist nicht gültig oder Song konnte nicht gefunden werden.')
            return
        for freqc, msec in tune:
            self.play_tone(freqc, msec)
    
    # Funktion, mit der vordefinierte RTTTL-Strings aus der Datei 'songs.py' geladen werden
    # Übergeben werden muss der String vor dem ':', z.B. 'TakeOnMe'
    def play_song_from_file(self, search):
        self.play_song(songs.find(search))