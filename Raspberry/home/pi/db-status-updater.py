#!/usr/bin/python3
#-*- coding:utf-8 -*-

import sqlite3
import paho.mqtt.client as mqtt
import logging
import json
import os
import configparser
import sys
import re

logging.basicConfig(level=logging.DEBUG, format=' %(asctime)s - %(levelname)s - %(message)s')
logging.debug('Starte Programm')

cfg = configparser.ConfigParser()


# cfg_path = os.path.join(os.path.dirname(__file__), '../config.ini')
# logging.info('Baue Verbindung zum Broker auf')
# logging.error('Fehler')
# logging.warning('Warnung')

# Wird aufgerufen, sobald sich db-status-updater mit dem Broker verbunden hat
def on_connect(client, userdata, flags, rc):
    logging.info('Verbindung zum Broker erfolgreich aufgebaut')
    logging.debug("Antwort vom Server: " + str(rc))

    client.subscribe([("lastwill", 1), ("connect", 1)])

# Wird aufgerufen, sobald sich ein Gerät mit dem MQTT Broker verbindet
def esp_connect_callback(client, userdata, msg):
    logging.debug('Greetz aus dem connect callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))

    try:
        client_payload = json.loads(msg.payload.decode("utf-8"))
        esp_id = client_payload['ID']
        esp_ip = client_payload['IP']
        esp_mac = client_payload['MAC']
        esp_status = 'Verbunden'
        logging.debug('ID: ' + esp_id + ' IP: ' + esp_ip + ' MAC: ' + esp_mac)
        
    except Exception as error:
        logging.error("JSON Fehler: " + str(error))
        logging.info("Verwerfe Paket")
        return


    # Pr�fe, ob Client mit der MAC schon in DB gelistet
    c.execute("SELECT id FROM espClients WHERE mac = (?)", (client_payload['MAC'], ))
    data = c.fetchone()
    if data is None:
        logging.info('Mac-Adresse ' + esp_mac + " bisher unbekannt.")

        #Lege neuen DB Eintrag an
        logging.info('Lege neuen DB Eintrag für ' + esp_id + ' an.')
        c.execute("INSERT INTO espClients (id, ip, mac, status) VALUES (?, ?, ?, ?)",
                      (esp_id, esp_ip, esp_mac, esp_status))
        conn.commit()

    else:
        logging.info('Client mit der MAC-Adresse ' + esp_mac + ' anhand der MAC-Adresse wiedererkannt.')
        #Setze Status auf Verbunden
        logging.info('Aktualisiere ID, IP und Status für ' + esp_mac)
        c.execute("UPDATE espClients SET id = (?), ip = (?), status = (?) WHERE mac = (?)", (esp_id, esp_ip, esp_status, esp_mac,))
        conn.commit()

# Wird aufgerufen, sobald ein Modul unerwartet die Verbindung verloren hat
def esp_last_will_callback(client, userdata, msg):
    logging.debug('Greetz aus dem last will callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))

    try:
        client_payload = json.loads(msg.payload.decode("utf-8"))
        esp_id = client_payload['ID']
        esp_ip = client_payload['IP']
        esp_mac = client_payload['MAC']
        esp_status = 'Getrennt'
        logging.debug('ID: ' + esp_id + ' IP: ' + esp_ip + ' MAC: ' + esp_mac)
        
    except Exception as error:
        logging.error("JSON Fehler: " + str(error))
        logging.info("Verwerfe Paket")
        return

    #Setze Status auf Getrennt
    c.execute("UPDATE espClients SET status = (?)  WHERE mac = (?)", (esp_status, esp_mac))
    logging.info("Status von " + esp_mac + " nun auf Getrennt.")
    conn.commit()

def create_table():
    c.execute('CREATE TABLE IF NOT EXISTS espClients( id TEXT, ip TEXT, mac TEXT, status TEXT )')

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
client.message_callback_add("lastwill", esp_last_will_callback)
client.message_callback_add("connect", esp_connect_callback)

#Lese Config-Datei aus

try:
    cfg.read("/home/pi/cfg.ini")
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
