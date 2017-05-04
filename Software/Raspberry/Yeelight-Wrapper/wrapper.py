import re
import socket
import logging
import errno
from threading import Thread
import _thread
from time import sleep
import struct
import sys
import os
import fcntl
import sqlite3
import paho.mqtt.client as mqtt
import configparser
import json

logging.basicConfig(level=logging.DEBUG, format=' %(asctime)s - %(levelname)s - %(message)s')

cfg = configparser.ConfigParser()
bulbs = {}
bulb = {}
bulb['ip'] = '192.168.178.31'
bulb['pwr'] = 'off'
bulb['brightness'] = '100'
bulb['rgb'] = '324234'

bulbs['Yeelight0'] = [bulb]
broadcast_IP = '239.255.255.250'
broadcast_Port = 1982
command_id = 0

#Empfange Daten der Suche hier
scan_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
fcntl.fcntl(scan_socket, fcntl.F_SETFL, os.O_NONBLOCK)

# COMMAND ID
def get_next_cmd_id():
    global command_id
    command_id += 1
    return command_id

# TOPIC TO NAME
msg = 'sub/Aktor/Yeelight/0'
def extractNameFromTopic(msg):
    return 'Yeelight' + str(int(re.search(r'\d+', msg).group()))

#print(extractNameFromTopic(msg))

def bulbs_detection_loop1():

    logging.debug("bulbs_detection_loop running")
    search_interval=30000
    #search_interval=10
    read_interval=100
    time_elapsed=0

    while True:
        if time_elapsed == search_interval:
            time_elapsed = 0
            sendSearchBroadcast()

        # scanner
        while True:
            try:
                data = scan_socket.recv(2048)
            except socket.error as e:
                err = e.args[0]
                if err == errno.EAGAIN or err == errno.EWOULDBLOCK:
                    break
                else:
                    print (e)
                    sys.exit(1)
            parseResponse(data)
            logging.debug("scanner")

        time_elapsed+=read_interval
        sleep(read_interval/1000.0)

# SEND NAME CMD
def sendCmdName(ip, name):
    try:
        tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_socket.connect((ip, 55443))
        cmd = "{\"id\":" + str(get_next_cmd_id()) + ",\"method\":\""
        cmd += "set_name" + "\",\"params\":[\"" + name + "\"]}\r\n"
        logging.debug(cmd)
        tcp_socket.send(str.encode(cmd))
        #tcp_socket.settimeout(5.0)
        #data = tcp_socket.recv(2048)
        #logging.debug(data.decode())
    except Exception as error:
        logging.error("Fehler: " + str(error))
    #tcp_socket.settimeout(None)
    tcp_socket.close()

# SEND RGB CMD
def sendCmdRGB(ip, val):
    try:
        tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_socket.connect((ip, 55443))

        cmd = "{\"id\":" + str(get_next_cmd_id()) + ",\"method\":\""
        cmd += "set_rgb" + "\",\"params\":[" +str(val) + ", \"smooth\", 250]}\r\n"
        logging.debug(cmd)
        tcp_socket.send(str.encode(cmd))
    except Exception as error:
        logging.error("Fehler: " + str(error))
    tcp_socket.close()


# SEND POWER CMD
def sendCmdPower(ip, state):
    try:
        tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_socket.connect((ip, 55443))

        cmd = "{\"id\":" + str(get_next_cmd_id()) + ",\"method\":\""
        cmd += "set_power" + "\",\"params\":[\"" + state + "\"]}\r\n"
        logging.debug(cmd)
        tcp_socket.send(str.encode(cmd))

        #tcp_socket.settimeout(5.0)
        #data = tcp_socket.recv(2048)
        #logging.debug(data.decode())
    except Exception as error:
        logging.error("Fehler: " + str(error))
    #tcp_socket.settimeout(None)
    tcp_socket.close()

# SEND TOGGLE CMD
def sendCmdToggle(ip):
    try:
        tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_socket.connect((ip, 55443))

        cmd = "{\"id\":" + str(get_next_cmd_id()) + ",\"method\":\""
        cmd += "toggle" + "\",\"params\":[" + "]}\r\n"
        logging.debug(cmd)
        tcp_socket.send(str.encode(cmd))

        #tcp_socket.settimeout(5.0)
        #data = tcp_socket.recv(2048)
        #logging.debug(data.decode())
    except Exception as error:
        logging.error("Fehler: " + str(error))
    #tcp_socket.settimeout(None)
    tcp_socket.close()

# SEND BRIGHTNESS CMD
def sendCmdBrightness(ip, brightness):
    try:
        tcp_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        tcp_socket.connect((ip, 55443))

        cmd = "{\"id\":" + str(get_next_cmd_id()) + ",\"method\":\""
        cmd += "set_bright" + "\",\"params\":[" + str(brightness) + "]}\r\n"
        logging.debug(cmd)
        tcp_socket.send(str.encode(cmd))
    except Exception as error:
        logging.error("JSON Fehler: " + str(error))
    tcp_socket.close()

# GET IP FROM RESPONSE
def parseResponse(response):
    response = response.decode()
    #print(response)
    location_re = re.compile("Location.*yeelight[^0-9]*([0-9]{1,3}(\.[0-9]{1,3}){3}):([0-9]*)")
    match = location_re.search(response)
    if match == None:
        logging.error("Antwort konnte nicht ausgewertet werden: " + response)
        return
    bulb_name = getBulbParams(response, "name")
    #prüfe, ob die gefundene Birne bereits in der Liste steht
    if bulb_name in bulbs:
        #falls ja muss nichts mehr gemacht werden
        return
    else:
        #prüfe, ob die Birne
        return
    #for b in bulbs:





    #Prüfe, ob eine Lampe noch keinen Namen hat
    #if bulb_name == '':
    #    bulb = {}
    #    bulb['ip'] = match.group(1)
    #    bulb['pwr'] = getBulbParams(response, "power")
    #    bulb['brightness'] = getBulbParams(response, "bright")
    #    bulb['rgb'] = createRGB(getBulbParams(response, "rgb"))




    #name = 'yeelight'

    #bulbs[name] = [bulb]
    #bulbs['yeelight2'] = {'penis':True}
    #print(bulbs['yeelight'][0]['pwr'])
    #print('Anzahl Birnen: ', len(bulbs))
    #print('Birnen Params', bulbs)

# GET STATUS PARAMS FROM RESPONSE
def getBulbParams(response, param):
    param_re = re.compile(param + ":\s*([ -~]*)")  # match all printable characters
    match = param_re.search(response)
    value = ""
    if match != None:
        value = match.group(1)
        return value

# SEARCH BROADCAST
def sendSearchBroadcast():
  multicase_address = (broadcast_IP, 1982)
  logging.debug("create search request")
  msg = "M-SEARCH * HTTP/1.1\r\n"
  msg += "HOST: 239.255.255.250:1982\r\n"
  msg += "MAN: \"ssdp:discover\"\r\n"
  msg += msg + "ST: wifi_bulb"
  logging.debug("send search request")
  scan_socket.sendto(str.encode(msg), multicase_address)

  # CREATE RGB DIC
def createRGB(rgb_dec):
  rgb_hex = '{0:06x}'.format(int(rgb_dec))
  rgb_dic = {}
  red = int(rgb_hex[:2], 16)
  green = int(rgb_hex[2:4], 16)
  blue = int(rgb_hex[4:6], 16)
  return [red, green, blue]

# CHECK DB ENTRIES
def checkIPinDB(ip):
  return

# CHECK IF YEELIGHT ALREADY IN DB
def checkYeelightsinDB():
  return

# CHECK IF DIC BULBS IS EMPTY ? SCAN AND CHECK DB
def init():
  return

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

def create_table():
    c.execute('CREATE TABLE IF NOT EXISTS espClients( status TEXT, mac TEXT, IP TEXT, type TEXT, name TEXT )')

# Parse Node-Red Command
def handleNodeRedCmd(client, userdata, msg):
    logging.debug('Greetz aus dem return name callback')
    logging.info(msg.topic + " " + str(msg.payload) + " " + str(msg.qos))
    yeelight = extractNameFromTopic(msg.topic)

    if len(str(msg.payload)) > 3:
        text = str(msg.payload)[2:len(str(msg.payload)) - 1]
        logging.debug('Json-Datei: ' + text)
    else:
        text = str(msg.payload)
        logging.debug('Payload: ' + text)

    try:
        nodeRedPayload = json.loads(text)
        identifier = nodeRedPayload['identifier']
        if yeelight in bulbs:

            if identifier == 'data':
                if 'toogle' in nodeRedPayload:
                    sendCmdToggle(bulbs[yeelight][0]['ip'])
                if 'set_pwr' in nodeRedPayload:
                    sendCmdPower(bulbs[yeelight][0]['ip'], nodeRedPayload['set_pwr'])
                if 'set_rgb'in nodeRedPayload:
                    colour = nodeRedPayload['set_rgb'][0]*65536 + nodeRedPayload['set_rgb'][1]*256 + nodeRedPayload['set_rgb'][2]
                    sendCmdRGB(bulbs[yeelight][0]['ip'], colour)
                if 'set_brightness' in nodeRedPayload:
                    sendCmdBrightness(bulbs[yeelight][0]['ip'], nodeRedPayload['set_brightness'])

            if identifier == 'status':
                return

    except Exception as error:
        logging.error("JSON Fehler: " + str(error))
        logging.info("Verwerfe Paket")
        return
    return


def on_connect(client, userdata, flags, rc):
        logging.info('Verbindung zum Broker erfolgreich aufgebaut')
        logging.debug("Antwort vom Server: " + str(rc))

        client.subscribe([("pub/Aktor/Yeelight/#", 1), ("sub/Aktor/Yeelight/#", 1)])





client = mqtt.Client(client_id='yeelight_wrapper', clean_session=False)
client.on_connect = on_connect
client.message_callback_add("sub/Aktor/Yeelight/#", handleNodeRedCmd)


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

conn = sqlite3.connect(pathToDB)
c = conn.cursor()
create_table()

sendSearchBroadcast()

#mqtt_thread = Thread(target=client.loop_forever())
client.loop_start()
detection_thread = Thread(target=bulbs_detection_loop1())

detection_thread.start()


#while True:
#    bulbs_detection_loop1()

#data = scan_socket.recv(2048)
#print(data.decode())
#parseResponse(data)

#sendCmdPower('192.168.178.31', 'off')
#sendCmdPower('192.168.178.31', 'on')
#sendCmdToggle('192.168.178.31')
#sendCmdBrightness('192.168.178.31', 10)
#sendCmdRGB('192.168.178.31', '12345')
#sendCmdName('192.168.178.31', 'penis')


#scan_socket.close()
#RUNNING = False
#detection_thread.join()

