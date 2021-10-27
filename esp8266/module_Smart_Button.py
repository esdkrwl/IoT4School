import ujson
from blink import blink
from machine import Pin
import OneButton # https://github.com/micropython/micropython/pull/2113/files (In Firmware eingefroren)

class Smart_Button:
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
        # z.B. sub/wemos1/Sensor/Smart_Button/Smartie
        # bzw. pub/wemos1/Sensor/Smart_Button/Smartie
        self.mqtt_client = mqtt_client
        self.mqtt_client.subscribe('sub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name, self.qos)
        self.publish_topic = ('pub/' + self.device_id + '/' + self.type + '/'
                                  + type(self).__name__ + '/' + self.name)
        
        # --- Modulspezifische Parameter ---
        
        # Zeit in ms bevor Klick registriert wird
        self.ticks = 600
        # Zeit in ms bevor langer Klick (Gedrückthalten des Buttons) erkannt wird
        self.press_ticks = 800
        # Anzahl bisher getätigter Klicks (Nach Reboot/Reset wieder auf 0)
        self.total_clicks = 0
        
        # --- Modulsepzifische Initialisierung ---
        self.button = OneButton.OneButton(self.pin, True)
        self.setup_button()
    
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
        if 'set_ticks' in json:
            if isinstance(json['set_ticks'], int):
                if json['set_ticks'] > 0 and json['set_ticks'] <= 1000:
                    self.set_ticks(json['set_ticks'])
        
        if 'set_press_ticks' in json:
            if isinstance(json['set_press_ticks'], int):
                if json['set_press_ticks'] > 0 and json['set_press_ticks'] <= 2000:
                    self.set_press_ticks(json['set_press_ticks'])
        
        if 'reset_total_clicks' in json:
            if json['reset_total_clicks'] == True:
                self.reset_total_clicks()
            #if isinstance(json['reset_total_clicks'], int) or isinstance(json['reset_total_clicks'], bool):
                #if json['reset_total_clicks'] == 1 or json['reset_total_clicks'] == True:
        
    # Callback-Methode, falls der Identifier data im Payload gefunden wurde
    def on_data(self, json):
        print('[DEBUG] Identifier data im Payload gefunden.')
    
    # Callback-Methode, falls der Identifier status im Payload gefunden wurde
    def on_status(self, json):
        print('[DEBUG] Identifier status im Payload gefunden.')
        msg = '{{"identifier": "status", "ticks": {}, "press_ticks": {}, "total_clicks": {}}}'\
              .format(self.ticks, self.press_ticks, self.total_clicks)
        print('[DEBUG] Sende folgenden Status:', msg)
        # Argumente: Topic, Message bzw. Payload, Retain-Wert, QoS
        self.mqtt_client.publish(self.publish_topic, msg, False, self.qos)
        blink()
    
    # Callbackmethode, falls Button 1x gedrückt wurde
    def on_single_click(self, button):
        print('[DEBUG] "on_single_click"- Callback ausgelöst.')
        self.total_clicks += 1
        
        msg = '{"identifier": "data", "click_event": "on_single_click"}'
        # Argumente: Topic, Message, Retain, QoS
        if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
            print('[INFO] Button Payload erfolgreich versendet.')
        else:
            print('[ERROR] Button Payload nicht versendet.')
    
    # Callbackmethode, falls Button 2x kurz hintereinander gedrückt wurde (Doppelklick)
    def on_double_click(self, button):
        print('[DEBUG] "on_double_click"- Callback ausgelöst.')
        self.total_clicks += 1
        
        msg = '{"identifier": "data", "click_event": "on_double_click"}'
        # Argumente: Topic, Message, Retain, QoS
        if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
            print('[INFO] Button Payload erfolgreich versendet.')
        else:
            print('[ERROR] Button Payload nicht versendet.')
    
    # Callbackmethode, falls Button lange gedrückt wurde
    def on_long_press(self, button):
        print('[DEBUG] "on_long_press"- Callback ausgelöst.')
        self.total_clicks += 1
        
        msg = '{"identifier": "data", "click_event": "on_long_press"}'
        # Argumente: Topic, Message, Retain, QoS
        if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
            print('[INFO] Button Payload erfolgreich versendet.')
        else:
            print('[ERROR] Button Payload nicht versendet.')
    
    # Callbackmethode, falls Button, nach einem langen Drücken des Buttons, wieder losgelassen wird
    def on_long_press_stop(self, button):
        print('[DEBUG] "on_long_press_stop"- Callback ausgelöst.')
        self.total_clicks += 1
        
        msg = '{"identifier": "data", "click_event": "on_long_press_stop"}'
        # Argumente: Topic, Message, Retain, QoS
        if self.mqtt_client.publish(self.publish_topic, msg, False, self.qos):
            print('[INFO] Button Payload erfolgreich versendet.')
        else:
            print('[ERROR] Button Payload nicht versendet.')
        
    # Konfiguriert den Button und die Callback Methoden
    def setup_button(self):
        self.button.setClickTicks(self.ticks)
        self.button.setPressTicks(self.press_ticks)
        self.button.attachClick(self.on_single_click)
        self.button.attachDoubleClick(self.on_double_click)
        self.button.attachLongPressStart(self.on_long_press)
        self.button.attachLongPressStop(self.on_long_press_stop)
        
    # --- Ab hier folgen Funktionen, die man in BIPES als Blöcke realisieren kann ---
    def set_ticks(self, ticks):
        print('[INFO] Setze Zeit bevor ein Klick registriert wird auf {}ms.'.format(ticks))
        self.ticks = ticks
        self.button.setClickTicks(ticks)
        
    def set_press_ticks(self, press_ticks):
        print('[INFO] Setze Zeit bevor ein langer Klick (Halten des Buttons) registriert wird auf {}ms.'.format(press_ticks))
        self.press_ticks = press_ticks
        self.button.setClickTicks(press_ticks)
    
    def reset_total_clicks(self):
        print('[INFO] Setze den Counter für die Anzahl der getätigten Klicks auf 0 zurück.')
        self.total_clicks = 0
        
    def get_total_clicks(self):
        return self.total_clicks
        