import gc
import network
import machine
import utime

publish_time_prev = utime.ticks_ms()

# Funktion, die die Verbindung zum Netzwerk und zum Broker prüft
def verify_connection(network_manager):
    global publish_time_prev
    if not network.WLAN(network.STA_IF).isconnected() or network_manager.mqtt_client.is_conn_issue():
        network_manager.connect()
    # Wenn 15 Sekunden verstrichen sind, wird der MQTT Broker gepingt, um die Keep Alive-Zeit zurückzusetzen
    # (Workaround, wenn keine Module eingebunden wurden, die regelmäßig mit dem Broker kommunizieren)
    publish_time = utime.ticks_ms()
    if utime.ticks_diff(publish_time, publish_time_prev) >= 15000:
        network_manager.mqtt_client.ping()
        publish_time_prev = publish_time
    # Bei jedem Durchlauf nicht benötigte Objekte aus dem Speicher entfernen
    gc.collect()
    # Hier wird geprüft, ob der MQTT Broker Nachrichten für den ESP hat
    network_manager.mqtt_client.check_msg()
        