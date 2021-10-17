# Original
# Project: WiFi Manager
# Author: Igor Ferreira
# Description: An updated and optimized wifi manager library for ESP chips, written in MicroPython.
# Source: https://github.com/h1pn0z/micropython-wifi_manager/
# License: MIT
# Version: 2.0.0
# Description: WiFi Manager for ESP8266 and ESP32 using MicroPython.

# Modified by Guido Casjens
# Description: Added support for hidden networks and additional fields/handling for MQTT. Also using json instead of wifi.dat for saving credentials.
from umqtt.robust2 import MQTTClient
from cb_handler import device_callback, create_last_will_msg, create_connect_msg
import jsonhandling
import network
import usocket
import ure
import ubinascii
import utime
import machine

# Netzwerk-Manager Klasse
# Beinhaltet Funktionen zur Verbindungsherstellung zum WLAN-Netzwerk und zum MQTT-Broker
class NetworkManager:
    # Initialisierung erfolgt mithilfe der Daten aus dem "networking.py"-Skript
    # Parameter: Geräte-ID, AP Passwort, WLAN-Zugangsdaten, MQTT-Zugangsdaten
    def __init__(self, device_id, ap_password, wireless_config, mqtt_settings):
        machine.Pin(2, machine.Pin.OUT).on()
        self.wlan_sta = network.WLAN(network.STA_IF)
        self.wlan_sta.active(True)
        self.mac = (ubinascii.hexlify(self.wlan_sta.config('mac'),":")).decode('utf-8')
        self.wlan_ap = network.WLAN(network.AP_IF)
        self.wlan_ap.active(False)
        self.device_id = device_id
        self.ap_password = ap_password
        self.wireless_config = wireless_config
        self.mqtt_settings = mqtt_settings
        self.mqtt_client = None
        self.reconnect = False
        
        # Wenn nicht gesetzt, greift mögliche Änderung des Hostnamens nicht (Konflikt mit dem cached Hostname)
        self.wlan_sta.disconnect()
        self.wlan_sta.config(dhcp_hostname = self.device_id)
        
        # Setze Access Point Verschlüsselungsmethode auf WPA2-PSK.
        self.ap_authmode = 3

    # Prüfen, ob Verbindung zum WLAN sowie zum MQTT-Broker mit den Daten aus der device_config.json geklappt hat
    # Return-Wert: True, wenn Verbindung erfolgreich. Ansonsten wird ein Web-Server gestartet.
    def connect(self):
        if self.__WifiConnect(self.wireless_config[0], self.wireless_config[1], self.reconnect):
            if self.__MQTTConnect(self.device_id, self.mqtt_settings[0], self.mqtt_settings[1], self.mqtt_settings[2], self.reconnect):
                machine.Pin(2, machine.Pin.OUT).off()
                self.reconnect = True
                return True
            else:
                machine.Pin(2, machine.Pin.OUT).on()
                print('\n[INFO] Verbindung zum MQTT-Broker konnte nicht hergestellt werden. Starte das Konfigurationsportal...')
                return self.__WebServer()
        else:
            machine.Pin(2, machine.Pin.OUT).on()
            print('\n[INFO] Verbindung zum WLAN Netzwerk konnte nicht hergestellt werden. Starte das Konfigurationsportal...')
            return self.__WebServer()

    # Interne Funktion, um WLAN-Verbindung herzustellen.
    # Parameter: WLAN-SSID, WLAN-Passwort
    def __WifiConnect(self, ssid, password, reconnect):
        print('[INFO] Verbindungsversuch zur SSID:', ssid, end='')
        
        if reconnect == False:
            # Scan, um Verbinden trotz falsch hinterlegter Anmeldeinformationen zu verhindern
            # ("Erzwungende" Löschung der gecacheden WLAN-Zugangsdaten)
            # Behebt auch Problem mit dem Soft Reset durch BIPES
            try:
                self.wlan_sta.scan()
            except:
                print('[DEBUG] Scan fehlgeschlagen')
        
            self.wlan_sta.connect(ssid, password)
        
            for _ in range(20):
                if self.wlan_sta.isconnected():
                    ip, sub, gw, dns = self.wlan_sta.ifconfig()
                    print('\n[INFO] Verbunden mit IP:', ip, ', Subnetz:', sub, ', Gateway:', gw, 'und DNS:', dns, '.')
                    return True
                else:
                    machine.Pin(2, machine.Pin.OUT).on()
                    print('.', end='')
                    utime.sleep_ms(250)
                    machine.Pin(2, machine.Pin.OUT).off()
                    utime.sleep_ms(250)
            return False
        # Loopt solange, bis Verbindung zum WLAN-Netzwerk wiederhergestellt werden konnte
        else:
            while True:
                if self.wlan_sta.isconnected():
                    ip, sub, gw, dns = self.wlan_sta.ifconfig()
                    print('\n[INFO] Verbunden mit IP:', ip, ', Subnetz:', sub, ', Gateway:', gw, 'und DNS:', dns, '.')
                    return True
                else:
                    machine.Pin(2, machine.Pin.OUT).on()
                    print('.', end='')
                    utime.sleep_ms(250)
                    machine.Pin(2, machine.Pin.OUT).off()
                    utime.sleep_ms(250)
    
    # Interne Funktion, um Verbindung zum MQTT-Broker herzustellen.
    # Parameter: MQTT-ID, MQTT Host Adresse, MQTT Port, Keepalive-Zeit, Reconnect
    # Return-Wert: True, wenn Verbindung zum Broker erfolgreich. Ansonsten False.
    def __MQTTConnect(self, client_id, mqtt_server, mqtt_port, keep_alive, reconnect):
        # Wenn es sich nicht um einen Reconnect handelt, werden die Subscribes und der Last Will neu gesetzt
        if reconnect == False:
            print('[INFO] Verbindungsversuch zum MQTT Broker mit IP bzw. Hostnamen:', mqtt_server, 'und Port:', mqtt_port, end='')
            self.mqtt_client = None
            for _ in range(4):
                machine.Pin(2, machine.Pin.OUT).off()
                utime.sleep_ms(100)
                machine.Pin(2, machine.Pin.OUT).on()
                utime.sleep_ms(250)
            try:
                # Parameter für MQTTClient (Client-ID, Server, Port, Benutzer, Passwort, Keepalive-Zeit)
                self.mqtt_client = MQTTClient(client_id + '_' + self.mac, mqtt_server, int(mqtt_port), None, None, int(keep_alive))
                self.mqtt_client.set_last_will('lastwill', create_last_will_msg(client_id, self.wlan_sta.ifconfig()[0], self.mac), False, 1)
                self.mqtt_client.connect(False)
            except ValueError as err:
                print('\n[ERROR] Es wurden ungültige MQTT-Daten angegeben. ({})'.format(err))
                return False
            for _ in range(1):
                if not self.mqtt_client.is_conn_issue():
                    print('\n[INFO] Verbunden mit {} MQTT Broker. Subscription zum Topic {}.'.format(mqtt_server, client_id))
                    self.mqtt_client.set_callback(device_callback) 
                    self.mqtt_client.subscribe('sub/' + client_id, 1)
                    self.mqtt_client.publish('connect', create_connect_msg(client_id, self.wlan_sta.ifconfig()[0], self.mac), False, 1)
                    return True
                else:
                    self.mqtt_client.connect(False)
            return False
        # Wenn es sich um einen Reconnect handelt, werden die Subscribes und der Last Will nicht überschrieben
        # Bisher gesetzte Subscribes werden erneut abonniert
        # Loopt solange, bis Verbindung zum Broker wiederhergestellt werden konnte
        else:
            print('[INFO] Reconnectversuch zum MQTT Broker mit IP bzw. Hostnamen:', mqtt_server, 'und Port:', mqtt_port, end='')
            self.mqtt_client.reconnect()  
            
            while True:
                if not self.mqtt_client.is_conn_issue():
                    print('\n[INFO] Reconnect zum MQTT Broker mit der IP {} erfolgreich.'.format(mqtt_server))
                    self.mqtt_client.publish('connect', create_connect_msg(client_id, self.wlan_sta.ifconfig()[0], self.mac), False, 1)
                    return True
                else:
                    machine.Pin(2, machine.Pin.OUT).off()
                    print('.', end='')
                    utime.sleep_ms(100)
                    machine.Pin(2, machine.Pin.OUT).on()
                    utime.sleep_ms(250)
                    self.mqtt_client.reconnect()
    
    # Interne Funktion, um einen Webserver zu starten, der unter der Standard-IP 192.168.4.1 erreichbar ist
    # SSID, mit der man sich verbinden muss, entspricht der Geräte-ID
    # Diese Funktion läuft in einer While-Schleife, bis die Konfiguration mit neuen Anmeldedaten erfolgreich ist
    def __WebServer(self):
        print('[INFO] Aktiviere Access Point...')
        self.wlan_sta.disconnect()
        self.wlan_ap.active(True)
        utime.sleep(1)
        self.wlan_ap.config(essid = self.device_id, password = self.ap_password, authmode = self.ap_authmode)
        server_socket = usocket.socket()
        server_socket.close()
        server_socket = usocket.socket(usocket.AF_INET, usocket.SOCK_STREAM)
        server_socket.setsockopt(usocket.SOL_SOCKET, usocket.SO_REUSEADDR, 1)
        server_socket.bind(('', 80))
        server_socket.listen(2)
        print('[INFO] Verbinde dich mit der SSID', self.device_id, 'und dem Passwort', self.ap_password, 'und gib', self.wlan_ap.ifconfig()[0], 'in die URL-Leiste deines Browsers ein.')
        while True:
            print('[DEBUG] Webserveraktivität')
            self.client, addr = server_socket.accept()
            print('[INFO] Zugriff von Gerät mit Adresse:', addr)
            try:
                self.client.settimeout(5.0)
                self.request = b''
                try:
                    while True:
                        if '\r\n\r\n' in self.request:
                            # Fix für den Safari Browser
                            self.request += self.client.recv(512)
                            break
                        self.request += self.client.recv(128)
                except OSError:
                    # Es kann bei der Verbindung zum Webserver zu Timeout Fehlern kommen, die aber ignoriert werden können
                    pass
                if self.request:
                    print('[INFO] REQUEST DATEN:', self.request)
                    # Regex-Suche für die URL im Request-String
                    url = ure.search('(?:GET|POST) /(.*?)(?:\\?.*?)? HTTP', self.request).group(1).decode('utf-8').rstrip('/')
                    if url == "":
                        self.__HandleRoot()
                    elif url == "configure":
                        if self.__HandleConfigure():
                            print('[INFO] Deaktiviere AP-Modus und schließe Server-Socket...')
                            self.wlan_ap.active(False)
                            self.reconnect = True
                            server_socket.close()
                            return True
                    else:
                        self.__HandleNotFound()
            except Exception as e:
                print('[ERROR]:', e)
                return False
            finally:
                self.client.close()
                
    # Interne, ausgegliederte Funktion, da jedes mal ein HTTP-Header mitgesendet werden muss, sobald eine Antwort vom Webserver erwartet wird
    def __SendHeader(self, status_code = 200):
        self.client.send("""HTTP/1.1 {0} OK\r\n""".format(status_code))
        self.client.send("""Content-Type: text/html\r\n""")
        self.client.send("""Connection: close\r\n""")
    
    # Interne Funktion, die von __HandleConfigure aufgerufen wird, um eine Antwort an den Client zu senden
    # Der angezeigte Text im HTML-Body lässt sich als Payload-Parameter übergeben
    def __SendResponse(self, payload, status_code = 200):
        self.__SendHeader(status_code)
        self.client.sendall("""
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Network Manager</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="icon" href="data:,">
                </head>
                <body>
                    {0}
                </body>
            </html>
        """.format(payload))
        self.client.close()
    
    # Interne Funktion, die aufgerufen wird, sobald ein direkter Zugriff auf 192.168.1.4 erfolgt
    # Zeigt die vorhandenen Netzwerke an und gibt Optionen für die Eingabe von Zugangsdaten
    # Beim Klick auf den Connect-Button, wird 192.168.1.4/configure aufgerufen und die Formulardaten werden
    # an die Funktion __HandleConfigure zur weiteren Verarbeitung weitergereicht
    def __HandleRoot(self):
        self.__SendHeader()
        self.client.sendall("""
            <!DOCTYPE html>
            <html lang="en">
                <head>
                    <title>Network Manager</title>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <link rel="icon" href="data:,">
                </head>
                <body>
                    <h1>Network Setup für {0}</h1>
                    <p>Für die Verbindung zu einem offenen Netzwerk, lass das Passwort-Feld leer.</p>
                    <p>Bei einem versteckten Netzwerk, kann die SSID unter "Sonstige SSID" eingetragen werden.</p>
                    <form action="/configure" method="post" accept-charset="utf-8">
        """.format(self.device_id))
        if self.device_id == 'wemos9999':
            self.client.sendall("""
                        <p><span style="color:#c0392b">Standard Hostname (wemos9999) erkannt! Bitte setze einen neuen Hostnamen: <input type="text" name="hostname" /></span></p>
            """)
        try:
            for ssid, *_ in self.wlan_sta.scan():
                ssid = ssid.decode("utf-8")
                self.client.sendall("""
                            <p><input type="radio" name="ssid" value="{0}" id="{0}"><label for="{0}">&nbsp;{0}</label></p>
                """.format(ssid))
        except:
            print('[DEBUG] Scan fehlgeschlagen')
            self.client.close()
            pass
        self.client.sendall("""
                        <p><input type="radio" name="ssid" value="">Sonstige SSID: <input type="text" name="ssid_custom" /></p>
                        <p><label for="password">Password:&nbsp;</label><input type="password" id="password" name="password"></p>
                        <table border="1" cellpadding="1" cellspacing="2">
                            <thead>
                                <tr>
                                    <th colspan="2" scope="col"><strong>MQTT-Einstellungen</strong></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>MQTT-Server:</td>
                                    <td><input type="text" id="mqttServer" name="mqttServer"></td>
                                </tr>
                                <tr>
                                    <td>MQTT-Port:</td>
                                    <td><input type="number" id="mqttPort" name="mqttPort" value="1883"></td>
                                </tr>
                            </tbody>
                            </table>
                        <p><input type="submit" value="Connect"></p>
                    </form>
                </body>
            </html>
        """)
        self.client.close()
    
    # Interne Funktion, die die Formulardaten aus __HandleRoot verarbeitet, wenn die Daten über den Connect Button submittet wurden
    # Der Request wird mittels Regex-Suchmustern nach passenden Daten durchsucht
    def __HandleConfigure(self):
        match = ure.search('ssid=([^&]*)', self.request)
        match_custom = ure.search('ssid=&ssid_custom=([^&]*)', self.request)
        match_password = ure.search('password=([^&]*)', self.request)
        match_mqtt = ure.search('mqttServer=([^&]+)&mqttPort=([^&]+)', self.request)
        match_name = ure.search('hostname=([^&]*)', self.request)
        #Neuer Regex: hostname=((?!\s*$).+)
        #print('[DEBUG] Match Custom:', match_custom)
        #print('[DEBUG] Match:', match)
        
        if match_name:
            hostname = match_name.group(1).decode('utf-8').replace('%3F', '?').replace('%21', '!')
            if len(hostname) == 0:
                self.__SendResponse("""<p>Der Hostname wurde nicht verändert!</p><p>Gehe zurück und ändere den Hostnamen!</p>""")
                return False
            else:
                #self.wlan_sta.config(dhcp_hostname = hostname)
                jsonhandling.write_key(hostname, 'name')
                self.__SendResponse("""
                                <p>Der Hostname wurde erfolgreich zu {0} geändert!</p>
                                <p>Gerät wird neu gestartet und ist jetzt mit der SSID {0} erreichbar.</p>
                """.format(hostname))
                utime.sleep(5)
                machine.reset()
        
        # Entweder wurde eine SSID aus der Liste ausgewählt (match) oder es wurde "Sonstige SSID" ausgewählt (match_custom)
        if match or match_custom:
            if match:
                print('[DEBUG] SSID Standardzuweisung')
                self.wireless_config[0] = match.group(1).decode('utf-8').replace('%3F', '?').replace('%21', '!').replace('%23', '#')
            if match_custom:
                print('[DEBUG] SSID Custom Zuweisung')
                self.wireless_config[0] = match_custom.group(1).decode('utf-8').replace('%3F', '?').replace('%21', '!').replace('%23', '#')
            if match_password:
                self.wireless_config[1] = match_password.group(1).decode('utf-8').replace('%3F', '?').replace('%21', '!')
            if match_mqtt:
                print('[DEBUG] MQTT Zuweisung')
                self.mqtt_settings[0] = match_mqtt.group(1).decode('utf-8').replace('%3F', '?').replace('%21', '!')
                self.mqtt_settings[1] = match_mqtt.group(2).decode('utf-8').replace('%3F', '?').replace('%21', '!')
            if len(self.wireless_config[0]) == 0:
                self.__SendResponse("""<p>SSID darf nicht leer sein!</p>""", 400)
            # Hier wird getestet, ob die übermittelten Daten einen erfolgreichen Verbindungsaufbau erzielen
            elif self.__WifiConnect(self.wireless_config[0], self.wireless_config[1], self.reconnect):
                # Erfolgreiche WLAN- und Broker-Verbindung
                # Daten werden in die device_config geschrieben und der User erhält eine positive Rückmeldung
                if self.__MQTTConnect(self.device_id, self.mqtt_settings[0], self.mqtt_settings[1], self.mqtt_settings[2], self.reconnect):
                    jsonhandling.write_key(self.wireless_config[0], 'wireless_config', 'SSID')
                    jsonhandling.write_key(self.wireless_config[1], 'wireless_config', 'password')
                    jsonhandling.write_key(self.mqtt_settings[0], 'mqtt_settings', 'mqtt_server')
                    jsonhandling.write_key(self.mqtt_settings[1], 'mqtt_settings', 'mqtt_port')
                    self.__SendResponse("""
                                    <p>Erfolgreich verbunden mit dem WLAN-Netzwerk <b>{0}</b>!</p><p>IP-Addresse: {1}</p>
                                    <p>Erfolgreich verbunden mit dem Broker <b>{2}</b>!</p><p>Port: {3}</p>
                    """.format(self.wireless_config[0], self.wlan_sta.ifconfig()[0], self.mqtt_settings[0], self.mqtt_settings[1]))
                    machine.Pin(2, machine.Pin.OUT).off()
                    utime.sleep(5)
                    return True
                # Erfolgreiche WLAN-Verbindung, aber fehlgeschlagene Verbindung zum Broker
                # WLAN-Daten werden in die device_config geschrieben, aber Webserver bleibt für die erneute Dateneingabe online
                else:
                    jsonhandling.write_key(self.wireless_config[0], 'wireless_config', 'SSID')
                    jsonhandling.write_key(self.wireless_config[1], 'wireless_config', 'password')
                    self.__SendResponse("""
                                    <p>Erfolgreich verbunden mit dem WLAN-Netzwerk <b>{0}</b>!</p><p>IP-Addresse: {1}</p>
                                    <p>Fehler beim Verbinden mit dem Broker <b>{2}</b>!</p><p>Port: {3}</p>
                                    <p>Gehe zurück und versuche es nochmal!</p>
                    """.format(self.wireless_config[0], self.wlan_sta.ifconfig()[0], self.mqtt_settings[0], self.mqtt_settings[1]))
                    utime.sleep(5)
                    return False
            # Fehlgeschlagene WLAN- und Broker-Verbindung
            # Benutzer erhält negative Rückmeldung, Webserver bleibt für die erneute Dateneingabe online
            else:
                self.__SendResponse("""<p>Konnte keine Verbindung zu <b>{0}</b> herstellen!</p><p>Gehe zurück und versuche es nochmal!</p>""".format(self.wireless_config[0]), 400)
                utime.sleep(5)
                return False
        else:
            self.__SendResponse("""<p>Parameter nicht gefunden!</p>""", 400)
            utime.sleep(5)
            return False

    def __HandleNotFound(self):
        self.__SendResponse("""<p>Pfad nicht gefunden!</p>""", 404)
        utime.sleep(5)