from check_connect import verify_connection
#from module_Motor import Motor
#from machine import I2C, Pin

dict = {} #Bereitgestellt durch iot_setup-Block. Objekt wird fuer MQTT-Handling der einzelnen Module benoetigt


# setup-Funktion
def setup():
  global dict
  global i
  #i = Motor('i', 5, 4, 0x30, network_manager.mqtt_client, network_manager.device_id)
  dict[i] = i
  

# loop-Funktion
def loop():
  global dict
  verify_connection(network_manager) # Bereitgestellt durch iot_setup-Block. Prueft kontinuierlich WLAN- und MQTT-Verbindung


# Bereitgestellt durch iot_setup-Block
# Hier wird die Funktion "setup" 1x ausgefuehrt und die Funktion "loop" laeuft, bis das Programm manuell abgebrochen wird
setup()
while True:
  loop()
