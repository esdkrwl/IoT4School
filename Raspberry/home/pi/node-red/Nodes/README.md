# Node-Red IoT4School

The development of an exemplary Internet of Things infrastructure for use in computer science classes.

## Intro
I can not recommend using these nodes yet, since there is almost no documentation online. Furthermore they were created for a very specific scenario and can therefore only be used with additional soft- and hardware.

## Usage
The nodes were created to teach in computer science classes how IoT devices can work and how to create own smart home solutions. In order to achieve that, I created some sensors and actuators based on the ESP-12E module and correspondent firmware. All sources can be found at my git repository.

To utilize the nodes completely you will need a sqlite3 database, a webserver, a MQTT broker and python3. Each hardware module will initialy communicate with the python script "saymyname.py" to get an individual topic. For example: if you add the "Smart-Button" board to the infrastructure, it will ask "saymyname" for an individual name. When "Smart-Button" is the first modul of its kind in the database, it will receive the name Smart-Button0 and subscribe the topic sub/Sensor/Smart-Button/0 and publish data over the topic pub/Sensor/Smart-Buttpn/0. The procedure is aquivalent for actuator modules. Informations about all connected and previous connected devices can be found on the webserver.

## Sensor Node
This nodes subscribes a sensor, e.g. Smart-Button0. Whenever Smart-Button0 publishes data with the identifier "data" in its payload, this node will forward the msg.

## Aktor Node
This nodes publishes messages to an actuator. The payload has to be an JSON-Object.

## An Node
Overwrites incoming messages to a "turn it on" command for actuators. Currently compatible to following hardware: rgb-controller, Yeelight bulbs and smart-socket.

## Aus Node
Overwrites incoming messages to a "turn it off" command for actuators. Currently compatible to following hardware: rgb-controller, Yeelight bulbs and smart-socket.

## Toggle Node
Overwrites incoming messages to a "toggle it" command for actuators. Currently compatible to following hardware: rgb-controller, yeelight bulbs and smart-socket.

## RGB Node
If the incoming message is not a rgb or hex colour value, this node will add a "set colour" command to the payload. The colour is specified within the node. A great feature is, that the RGB node is compatible to the colour picker node from the node-red dashboard.
This node can be used for the rgb-controller board or Yeelights. To use it for Yeelights you need to run the python3 script "wrapper.py" and enable developer mode on those bulbs. 

## Helligkeit Node
If the incoming message is not an integer or an string that can be parsed to an integer, this node will add a "set brightness" command to the payload. The brightness is specified within the node.
This node can be used for the rgb-controller board or Yeelights. To use it for Yeelights you need to run the python3 script "wrapper.py" and enable developer mode on those bulbs. 

## Servo Node
If the incoming message is not an integer or an string that can be parsed to an integer, this node will add a "set angle" command to the payload. The angle is specified within the node.
This node can be used for the servo-board.

##Klick Dekodierer Node
This node is exclusive for the Smart-Button board. Klick Dekodierer can recognize several click patters, which this node decodes and routes towords one of the four outputs.

## Wetter Dekodierer Node
This node is exclusive for the Weatherstation board. Wetter Dekodierer parses the payload from the weather station und routes the data towards the outputs. The temperature e.g. can be accessed via output 1.













## Contact
Feel free to contact my via [github](https://github.com/esdkrwl/IoT4School) or [Twitter](https://twitter.com/sdkrwl). I'd be grateful for feedback!
 

