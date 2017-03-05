import sqlite3
import paho.mqtt.client as mqtt
import logging
import json
import os

logging.basicConfig(level=logging.DEBUG, format=' %(asctime)s - %(levelname)s - %(message)s')
logging.debug('Starte Programm')


# cfg_path = os.path.join(os.path.dirname(__file__), '../config.ini')
# logging.info('Baue Verbindung zum Broker auf')
# logging.error('Fehler')
# logging.warning('Warnung')

def on_connect(client, userdata, flags, rc):
    logging.info('Verbindung zum Broker erfolgreich aufgebaut')
    logging.debug("Antwort vom Server: " + str(rc))

    client.subscribe([("esp/sensor/mac/#", 1), ("esp/aktor/mac/#", 1), ("esp/lastwill/mac/#", 1)])

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
        logging.debug('Neuer Name für Client: ' + esp_new_name)
        logging.info('Lege neuen DB Eintrag für ' + esp_new_name + ' an.')
        c.execute("INSERT INTO espClients (status, mac, IP, type, name) VALUES (? , ? , ?, ?, ? )",
                      (esp_status, esp_mac_adr, esp_ip_adr, esp_type, esp_new_name))
        conn.commit()



    else:
        logging.info('Client ' + esp_name + ' anhand der Mac-Adresse wiedererkannt.')
        #Setze Status auf Verbunden
        c.execute("UPDATE espClients SET status = (?) WHERE mac = (?)", ('Verbunden', esp_mac_adr,))
        conn.commit()
        #Suche den Namen aus der DB
        logging.debug('Mac Adresse ' + esp_mac_adr + ' gefunden.')

        logging.debug('Name des Clients in der DB: ' + data[0])
        esp_new_name = data[0]



#    c.close()
 #   conn.close()

    if esp_type == 'Sensor':
        topic_str = 'nameClient/sensor/mac/' + esp_mac_adr
        publish_payload = '{"identifier":"name", "new_name":"'+ esp_new_name +'", "topic":"esp/sensor/'+ esp_new_name +'"}'
        client.publish(topic_str, publish_payload, qos=1)
        logging.info('Sensor ' + esp_name + ' erhält den Namen ' + esp_new_name)
    else:
        topic_str = 'nameClient/aktor/mac/' + esp_mac_adr
        publish_payload = '{"identifier":"name", "new_name":"'+ esp_new_name +'", "topic":"esp/aktor/' + esp_new_name + '"}'
        client.publish(topic_str, publish_payload, qos=1)
        logging.info('Aktor ' + esp_name + ' erhält den Namen ' + esp_new_name)


def create_table():
    c.execute('CREATE TABLE IF NOT EXISTS espClients( status TEXT, mac TEXT, IP TEXT, type TEXT, name TEXT )')





client = mqtt.Client(client_id='name_client123', clean_session=True)
logging.debug('Client initialisiert')

client.will_set("test/log", payload="Ich bin raus leute", qos=1, retain=False)
logging.debug('Last will gesetzt')

client.on_connect = on_connect
#client.on_message = on_message
client.message_callback_add("esp/lastwill/mac/#", esp_last_will_callback)
client.message_callback_add("esp/sensor/mac/#", return_name_callback)

try:
    client.connect("192.168.178.23", 1883, 60)
except Exception as error:
    logging.error('Konnte keine Verbindung zum Broker aufbauen')

conn = sqlite3.connect('mqttClient.db')
c = conn.cursor()
create_table()

# client.loop_start()

client.loop_forever()
