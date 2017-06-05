import sqlite3
import paho.mqtt.client as mqtt
import logging
import json
import os
import configparser
import sys

logging.basicConfig(level=logging.DEBUG, format=' %(asctime)s - %(levelname)s - %(message)s')
logging.debug('Starte Programm')

cfg = configparser.ConfigParser()


# cfg_path = os.path.join(os.path.dirname(__file__), '../config.ini')
# logging.info('Baue Verbindung zum Broker auf')
# logging.error('Fehler')
# logging.warning('Warnung')

# wird aufgerufen, sobald sich saymyname mit dem Broker verbunden hat
def on_connect(client, userdata, flags, rc):
    logging.info('Verbindung zum Broker erfolgreich aufgebaut')
    logging.debug("Antwort vom Server: " + str(rc))

    client.subscribe([("Sensor/mac/#", 1), ("Aktor/mac/#", 1), ("esp/lastwill/mac/#", 1), ("esp/reconnect", 1)])

# wird aufgerufen, sobald sich ein Modul nach einem Verbindungsabbruch wieder verbindet
def esp_reconnect_callback(client, userdata, msg):
    logging.debug('Greetz aus dem reconnect callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))

    reconnect_data = str(msg.payload)[2:len(str(msg.payload)) - 1]
    reconnect_payload = json.loads(reconnect_data)
    reconnect_mac_adr = reconnect_payload['Mac']

    c.execute("UPDATE espClients SET status = (?) WHERE mac = (?)", ('Verbunden', reconnect_mac_adr,))
    conn.commit()

# wird aufgerufen, sobald ein Modul unerwartet die Verbindung verloren hat
def esp_last_will_callback(client, userdata, msg):
    logging.debug('Greetz aus dem last will callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))

    last_will_data = str(msg.payload)[2:len(str(msg.payload)) - 1]
    last_will_payload = json.loads(last_will_data)
    last_will_mac_adr = last_will_payload['Mac']

    #Setze Status auf Getrennt
    c.execute("UPDATE espClients SET status = (?)  WHERE mac = (?)", ('Getrennt', last_will_mac_adr))
    logging.info("Status von " + last_will_mac_adr + ": Getrennt.")
    conn.commit()

# wird aufgerufen, sobald sich ein Modul anmeldet und einen Namen haben möchte
def return_name_callback(client, userdata, msg):
    logging.debug('Greetz aus dem return name callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))
    if len(str(msg.payload)) > 3:
        text = str(msg.payload)[2:len(str(msg.payload)) - 1]
        logging.debug('Json-Datei: ' + text)
    else:
        text = str(msg.payload)
        logging.debug('Payload: ' + text)

    try:
        client_payload = json.loads(text)
        esp_mac_adr = client_payload['Mac']
        esp_ip_adr = client_payload['IP']
        esp_type = client_payload['Typ']
        esp_name = client_payload['Name']
        logging.debug('Mac: ' + esp_mac_adr + ' IP: ' + esp_ip_adr + ' Typ: ' + esp_type + ' Name: ' + esp_name)
        esp_status = 'Verbunden'
    except Exception as error:
        logging.error("JSON Fehler: " + str(error))
        logging.info("Verwerfe Paket")
        return


    #Prüfe, ob client mit der mac schon in db gelistet
    c.execute("SELECT name FROM espClients WHERE mac = (?)", (client_payload['Mac'], ))
    data = c.fetchone()
    if data is None:
        logging.info('Mac-Adresse ' + esp_mac_adr + " bisher unbekannt.")
        #Prüfe, wie oft der Sensor schon in der DB gelistet ist
        logging.debug('Zähle Einträge mit dem Namen ' + client_payload['Name'])
        anzahl = 0
        c.execute("SELECT name FROM espClients WHERE type = (?)", (client_payload['Typ'],))
        for row in c.fetchall():
            if esp_name in row[0]:
                anzahl = anzahl + 1
        logging.debug(str(anzahl) + ' Einträge gefunden.')
        #Lege neuen DB Eintrag an
        esp_new_name = esp_name + str(anzahl)
        suffix = anzahl
        logging.debug('Neuer Name für Client: ' + esp_new_name)
        logging.info('Lege neuen DB Eintrag für ' + esp_new_name + ' an.')
        c.execute("INSERT INTO espClients (status, mac, IP, type, name) VALUES (? , ? , ?, ?, ? )",
                      (esp_status, esp_mac_adr, esp_ip_adr, esp_type, esp_new_name))
        conn.commit()



    else:
        logging.info('Client ' + esp_name + ' anhand der Mac-Adresse wiedererkannt.')
        #Setze Status auf Verbunden
        c.execute("UPDATE espClients SET status = (?), IP = (?) WHERE mac = (?)", ('Verbunden', esp_ip_adr,  esp_mac_adr,))
        conn.commit()
        #Suche den Namen aus der DB
        logging.debug('Mac Adresse ' + esp_mac_adr + ' gefunden.')

        logging.debug('Name des Clients in der DB: ' + data[0])
        esp_new_name = data[0]
        #finde suffix im namen
        suffix = re.search('(\d+)$', esp_new_name)
        print(suffix)
        #suffix = esp_new_name[len(esp_new_name)-1]



#    c.close()
 #   conn.close()

    if esp_type == 'Sensor':
        topic_str = 'nameClient/Sensor/mac/' + esp_mac_adr
        publish_payload = '{"identifier":"name", "new_name":"'+ esp_new_name +'", "suffix":"'+str(suffix)+'"}'
        client.publish(topic_str, publish_payload, qos=1)
        logging.info('Sensor ' + esp_name + ' erhält den Namen ' + esp_new_name)
    else:
        topic_str = 'nameClient/Aktor/mac/' + esp_mac_adr
        publish_payload = '{"identifier":"name", "new_name":"'+ esp_new_name +'", "suffix":"'+str(suffix)+'"}'
        client.publish(topic_str, publish_payload, qos=1)
        logging.info('Aktor ' + esp_name + ' erhält den Namen ' + esp_new_name)


def create_table():
    c.execute('CREATE TABLE IF NOT EXISTS espClients( status TEXT, mac TEXT, IP TEXT, type TEXT, name TEXT )')

# Hilfsmethode zum Lesen der Config Datei
def ConfigSectionMap(section):
    dict1 = {}
    options = cfg.options(section)
    for option in options:
        try:
            dict1[option] = cfg.get(section, option)
            if dict1[option] == -1:
                logging.info("skip: %s" % option)
        except:
            logging.error("exception on %s!" % option)
            dict1[option] = None
    return dict1

client = mqtt.Client(client_id='name_client123', clean_session=False)
logging.debug('Client initialisiert')

client.will_set("test/log", payload="Ich bin raus leute", qos=1, retain=False)
logging.debug('Last will gesetzt')

client.on_connect = on_connect
#client.on_message = on_message
client.message_callback_add("esp/lastwill/mac/#", esp_last_will_callback)
client.message_callback_add("Sensor/mac/#", return_name_callback)
client.message_callback_add("Aktor/mac/#", return_name_callback)
client.message_callback_add("esp/reconnect", esp_reconnect_callback)

#Lese Config-Datei aus

try:
    cfg.read("cfg.ini")
except FileNotFoundError as error:
    logging.error("Config-Datei nicht gefunden.")
    sys.exit()

brokerIP = ConfigSectionMap("Broker-Settings")['ip']
brokerPort = ConfigSectionMap("Broker-Settings")['port']
pathToDB = ConfigSectionMap("DB-Settings")['pathtodb']

try:
    client.connect(brokerIP, int(brokerPort), 60)
except Exception as error:
    logging.error('Konnte keine Verbindung zum Broker aufbauen')
    sys.exit()

conn = sqlite3.connect(pathToDB)
c = conn.cursor()
create_table()

client.loop_forever()
