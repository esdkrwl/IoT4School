# MQTT Callback Handler Klasse
# Kümmert sich um die Weiterleitung und Verarbeitung der empfangenen MQTT-Nachrichten
import machine
import utime
import ubinascii
import network

# Modul Callback Handler
# Nachrichten, die für die IoT4School-Module bestimmt sind, werden hier gehandlet
# MQTT-Nachricht an das passende Modul weiterleitet
# Für die Unterstützung weiterer Module, müssen an dieser Funktion Anpassungen vorgenommen werden
def module_callback(dict, device_id, topic, msg, retain, duplicate):
    print('[INFO] Daten wurden empfangen.')
    print('[INFO] Topic: {} und Payload: {}.'.format(topic, msg))
    for key, value in dict.items():
        module_name = type(value).__name__
        if module_name == 'RGB_LED':
            if topic == b'sub/{}/Aktor/RGB_LED/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'Buzzer':
            if topic == b'sub/{}/Aktor/Buzzer/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'Motor':
            if topic == b'sub/{}/Aktor/Motor/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'Smart_Button':
            if topic == b'sub/{}/Sensor/Smart_Button/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'PIR':
            if topic == b'sub/{}/Sensor/PIR/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'DHT':
            if topic == b'sub/{}/Sensor/DHT/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        elif module_name == 'SHT3x':
            if topic == b'sub/{}/Sensor/SHT3x/{}'.format(device_id, key.name):
                key.callback(topic, msg, retain, duplicate)
        #elif module_name == 'Modulname':
            #if topic == b'sub/{}/Aktor/Modulname/{}'.format(device_id, key.name):
                #key.callback(topic, msg, retain, duplicate)
        else:
            print('[ERROR] Modultyp {} im Callback noch nicht definiert. Überspringe..'.format(module_name))
 
# Device Callback Handler, der während der Initialisierung im Networkmanager gesetzt wird
# Nachrichten, die direkt für das Gerät bestimmt sind, werden hier gehandlet
def device_callback(topic, msg, retain, duplicate):
    print('[DEBUG] Callback Handler für das Gerät')
    if msg.decode('utf-8') == (ubinascii.hexlify(network.WLAN(network.STA_IF).config('mac'),":")).decode('utf-8'):
        print('[INFO] Gerät wurde mit seiner MAC-Adresse angepingt und blinkt nun!')
        for _ in range(10):
            machine.Pin(2).on()
            utime.sleep_ms(100)
            machine.Pin(2).off()
            utime.sleep_ms(100)

# Funktion, die eine Last Will Nachricht im Falle eines Disconnects für den Broker vorbereitet
def create_last_will_msg(client_id, ip, mac):
    msg = '{{"ID": "{}", "IP": "{}", "MAC": "{}"}}'.format(client_id, ip, mac)
    return msg

# Funktion, die eine Connect Nachricht für die Erstverbindung zum Broker vorbereitet
def create_connect_msg(client_id, ip, mac):
    msg = '{{"ID": "{}", "IP": "{}", "MAC": "{}"}}'.format(client_id, ip, mac)
    return msg