
module.exports = function(RED) {
    "use strict";
    var mqtt = require("mqtt");
    var util = require("util");
    var isUtf8 = require('is-utf8');

    function matchTopic(ts,t) {
        if (ts == "#") {
            return true;
        }
        var re = new RegExp("^"+ts.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
        return re.test(t);
    }

    function IoTMQTTBrokerNode(n) {
        RED.nodes.createNode(this,n);

        // Configuration options passed by Node Red
        this.broker = n.broker;
        this.port = n.port;
        this.clientid = n.clientid;
        this.usetls = n.usetls;
        this.verifyservercert = n.verifyservercert;
        this.compatmode = n.compatmode;
        this.keepalive = n.keepalive;
        this.cleansession = n.cleansession;

        // Config node state
        this.brokerurl = "";
        this.connected = false;
        this.connecting = false;
        this.closing = false;
        this.options = {};
        this.queue = [];
        this.subscriptions = {};

        if (n.birthTopic) {
            this.birthMessage = {
                topic: n.birthTopic,
                payload: n.birthPayload || "",
                qos: Number(n.birthQos||0),
                retain: n.birthRetain=="true"|| n.birthRetain===true
            };
        }

        if (this.credentials) {
            this.username = this.credentials.user;
            this.password = this.credentials.password;
        }

        // If the config node is missing certain options (it was probably deployed prior to an update to the node code),
        // select/generate sensible options for the new fields
        if (typeof this.usetls === 'undefined') {
            this.usetls = false;
        }
        if (typeof this.compatmode === 'undefined') {
            this.compatmode = true;
        }
        if (typeof this.verifyservercert === 'undefined') {
            this.verifyservercert = false;
        }
        if (typeof this.keepalive === 'undefined') {
            this.keepalive = 60;
        } else if (typeof this.keepalive === 'string') {
            this.keepalive = Number(this.keepalive);
        }
        if (typeof this.cleansession === 'undefined') {
            this.cleansession = true;
        }

        // Create the URL to pass in to the MQTT.js library
        if (this.brokerurl === "") {
            if (this.usetls) {
                this.brokerurl="mqtts://";
            } else {
                this.brokerurl="mqtt://";
            }
            if (this.broker !== "") {
                this.brokerurl = this.brokerurl+this.broker+":"+this.port;
            } else {
                this.brokerurl = this.brokerurl+"localhost:1883";
            }
        }

        if (!this.cleansession && !this.clientid) {
            this.cleansession = true;
            this.warn(RED._("mqtt.errors.nonclean-missingclientid"));
        }

        // Build options for passing to the MQTT.js API
        this.options.clientId = this.clientid || 'mqtt_' + (1+Math.random()*4294967295).toString(16);
        this.options.username = this.username;
        this.options.password = this.password;
        this.options.keepalive = this.keepalive;
        this.options.clean = this.cleansession;
        this.options.reconnectPeriod = RED.settings.mqttReconnectTime||5000;
        if (this.compatmode == "true" || this.compatmode === true) {
            this.options.protocolId = 'MQIsdp';
            this.options.protocolVersion = 3;
        }
        if (this.usetls && n.tls) {
            var tlsNode = RED.nodes.getNode(n.tls);
            if (tlsNode) {
                tlsNode.addTLSOptions(this.options);
            }
        }
        // If there's no rejectUnauthorized already, then this could be an
        // old config where this option was provided on the broker node and
        // not the tls node
        if (typeof this.options.rejectUnauthorized === 'undefined') {
            this.options.rejectUnauthorized = (this.verifyservercert == "true" || this.verifyservercert === true);
        }

        if (n.willTopic) {
            this.options.will = {
                topic: n.willTopic,
                payload: n.willPayload || "",
                qos: Number(n.willQos||0),
                retain: n.willRetain=="true"|| n.willRetain===true
            };
        }

        // Define functions called by MQTT in and out nodes
        var node = this;
        this.users = {};

        this.register = function(mqttNode) {
            node.users[mqttNode.id] = mqttNode;
            if (Object.keys(node.users).length === 1) {
                node.connect();
            }
        };

        this.deregister = function(mqttNode,done) {
            delete node.users[mqttNode.id];
            if (node.closing) {
                return done();
            }
            if (Object.keys(node.users).length === 0) {
                if (node.client && node.client.connected) {
                    return node.client.end(done);
                } else {
                    node.client.end();
                    return done();
                }
            }
            done();
        };

        this.connect = function () {
            if (!node.connected && !node.connecting) {
                node.connecting = true;
                node.client = mqtt.connect(node.brokerurl ,node.options);
                node.client.setMaxListeners(0);
                // Register successful connect or reconnect handler
                node.client.on('connect', function () {
                    node.connecting = false;
                    node.connected = true;
                    node.log(RED._("mqtt.state.connected",{broker:(node.clientid?node.clientid+"@":"")+node.brokerurl}));
                    for (var id in node.users) {
                        if (node.users.hasOwnProperty(id)) {
                            node.users[id].status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
                        }
                    }
                    // Remove any existing listeners before resubscribing to avoid duplicates in the event of a re-connection
                    node.client.removeAllListeners('message');

                    // Re-subscribe to stored topics
                    for (var s in node.subscriptions) {
                        if (node.subscriptions.hasOwnProperty(s)) {
                            var topic = s;
                            var qos = 0;
                            for (var r in node.subscriptions[s]) {
                                if (node.subscriptions[s].hasOwnProperty(r)) {
                                    qos = Math.max(qos,node.subscriptions[s][r].qos);
                                    node.client.on('message',node.subscriptions[s][r].handler);
                                }
                            }
                            var options = {qos: qos};
                            node.client.subscribe(topic, options);
                        }
                    }

                    // Send any birth message
                    if (node.birthMessage) {
                        node.publish(node.birthMessage);
                    }
                });
                node.client.on("reconnect", function() {
                    for (var id in node.users) {
                        if (node.users.hasOwnProperty(id)) {
                            node.users[id].status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
                        }
                    }
                })
                // Register disconnect handlers
                node.client.on('close', function () {
                    if (node.connected) {
                        node.connected = false;
                        node.log(RED._("mqtt.state.disconnected",{broker:(node.clientid?node.clientid+"@":"")+node.brokerurl}));
                        for (var id in node.users) {
                            if (node.users.hasOwnProperty(id)) {
                                node.users[id].status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
                            }
                        }
                    } else if (node.connecting) {
                        node.log(RED._("mqtt.state.connect-failed",{broker:(node.clientid?node.clientid+"@":"")+node.brokerurl}));
                    }
                });

                // Register connect error handler
                node.client.on('error', function (error) {
                    if (node.connecting) {
                        node.client.end();
                        node.connecting = false;
                    }
                });
            }
        };

        this.subscribe = function (topic,qos,callback,ref) {
            ref = ref||0;
            node.subscriptions[topic] = node.subscriptions[topic]||{};
            var sub = {
                topic:topic,
                qos:qos,
                handler:function(mtopic,mpayload, mpacket) {
                    if (matchTopic(topic,mtopic)) {
                        callback(mtopic,mpayload, mpacket);
                    }
                },
                ref: ref
            };
            node.subscriptions[topic][ref] = sub;
            if (node.connected) {
                node.client.on('message',sub.handler);
                var options = {};
                options.qos = qos;
                node.client.subscribe(topic, options);
            }
        };

        this.unsubscribe = function (topic, ref) {
            ref = ref||0;
            var sub = node.subscriptions[topic];
            if (sub) {
                if (sub[ref]) {
                    node.client.removeListener('message',sub[ref].handler);
                    delete sub[ref];
                }
                if (Object.keys(sub).length === 0) {
                    delete node.subscriptions[topic];
                    if (node.connected) {
                        node.client.unsubscribe(topic);
                    }
                }
            }
        };

        this.publish = function (msg) {
            if (node.connected) {
                if (!Buffer.isBuffer(msg.payload)) {
                    if (typeof msg.payload === "object") {
                        msg.payload = JSON.stringify(msg.payload);
                    } else if (typeof msg.payload !== "string") {
                        msg.payload = "" + msg.payload;
                    }
                }

                var options = {
                    qos: msg.qos || 0,
                    retain: msg.retain || false
                };
                node.client.publish(msg.topic, msg.payload, options, function(err) {return});
            }
        };

        this.on('close', function(done) {
            this.closing = true;
            if (this.connected) {
                this.client.once('close', function() {
                    done();
                });
                this.client.end();
            } else if (this.connecting || node.client.reconnecting) {
                node.client.end();
                done();
            } else {
                done();
            }
        });

    }

    RED.nodes.registerType("iot-mqtt-broker",IoTMQTTBrokerNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });
    
    function SensorNode(config) {
        RED.nodes.createNode(this,config);
        
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        this.sensor = RED.nodes.getNode(config.sensor).IoTSensorName;
        this.number = config.number;
        this.topic = 'pub/Sensor/' + this.sensor + '/' + this.number;
        this.qos = parseInt(config.qos);
        this.name=config.name;
        
        if (!/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)) {
            return this.warn(RED._("mqtt.errors.invalid-topic"));
        }
        
        var node = this;
        
        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"Getrennt"});
            if (this.topic) {
                
                node.brokerConn.register(this);
                
                //subscribe beim Broker
                this.brokerConn.subscribe(node.topic,node.qos,function(topic,payload,packet) {  
                    if (isUtf8(payload)) {
                        payload = payload.toString();
                    }
                    var msg = {topic:topic, payload:payload, qos: packet.qos, retain: packet.retain};
                    if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")){
                        msg._topic = topic;
                    }
                    //Prüfe, ob Nachricht Payload hat
                    if (msg.hasOwnProperty("payload")) {

                        if (typeof msg.payload === "string") {
                            //Versuche String zu parsen
                            try {
                                msg.payload = JSON.parse(msg.payload);
                                if(msg.payload.identifier == 'data'){
                                    node.send(msg);
                                }
                                
                            }
                            catch(e) {
                                node.error('Fehler ' + e.message,msg); 
                            }
                        }
                        else { 
                            node.warn(RED._("json.errors.dropped"));
                        }
                    }
                    //Falls kein Payload vorhanden, leite die Nachricht einfach so weiter
                    else { 
                        node.send(msg); 
                    }

                    
                }, this.id);
                
                if (this.brokerConn.connected) {
                    node.status({fill:"green",shape:"dot",text:"Verbunden"});
                }
            }
            else {
                this.error(RED._("mqtt.errors.not-defined"));
            }
            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic,node.id);
                    node.brokerConn.deregister(node,done);
                }
            });
            
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }
    RED.nodes.registerType("Sensor",SensorNode);
    
    function IoTSensorNode(n) {
        RED.nodes.createNode(this,n);
        this.IoTSensorName = n.IoTSensorName;
    }
    RED.nodes.registerType("IoT-Sensor",IoTSensorNode);
    
    function SensorStatusNode(config){
        RED.nodes.createNode(this,config);
        
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        this.sensor = RED.nodes.getNode(config.sensor).IoTSensorName;
        this.number = config.number;
        this.topic = 'pub/Sensor/' + this.sensor + '/' + this.number;
        this.qos = parseInt(config.qos);
        this.name=config.name;
        
        var node = this;
        
        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"Getrennt"});
            if (this.topic) {
                
                node.brokerConn.register(this);
                
                //subscribe beim Broker
                this.brokerConn.subscribe(node.topic,node.qos,function(topic,payload,packet) {  
                    if (isUtf8(payload)) {
                        payload = payload.toString();
                    }
                    var msg = {topic:topic, payload:payload, qos: packet.qos, retain: packet.retain};
                    if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")){
                        msg._topic = topic;
                    }
                    //Prüfe, ob Nachricht Payload hat
                    if (msg.hasOwnProperty("payload")) {

                        if (typeof msg.payload === "string") {
                            //Versuche String zu parsen
                            try {
                                msg.payload = JSON.parse(msg.payload);
                                if(msg.payload.identifier == 'status'){
                                    node.send(msg);
                                }
                                
                            }
                            catch(e) {
                                node.error('Fehler ' + e.message,msg); 
                            }
                        }
                        else { 
                            node.warn(RED._("json.errors.dropped"));
                        }
                    }
                    //Falls kein Payload vorhanden, leite die Nachricht einfach so weiter
                    else { 
                        node.send(msg); 
                    }

                    
                }, this.id);
                
                if (this.brokerConn.connected) {
                    node.status({fill:"green",shape:"dot",text:"Verbunden"});
                }
            }
            else {
                this.error(RED._("mqtt.errors.not-defined"));
            }
            
            this.on('input', function (msg) {
                msg.qos = node.qos;
                msg.retain = 0;
                msg.topic = 'sub/Sensor/' + this.sensor + '/' + this.number;
                msg.payload = '{"identifier":"status"}';
                this.brokerConn.publish(msg);
                
            });
            
            
            
            
            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic,node.id);
                    node.brokerConn.deregister(node,done);
                }
            });
            
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
        
        
    }
    RED.nodes.registerType("SensorStatus", SensorStatusNode);
    

function AktorStatusNode(config){
        RED.nodes.createNode(this,config);
        
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        this.sensor = RED.nodes.getNode(config.sensor).IoTSensorName;
        this.number = config.number;
        this.topic = 'pub/Aktor/' + this.aktor + '/' + this.number;
        this.qos = parseInt(config.qos);
        this.name=config.name;
        
        var node = this;
        
        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"Getrennt"});
            if (this.topic) {
                
                node.brokerConn.register(this);
                
                //subscribe beim Broker
                this.brokerConn.subscribe(node.topic,node.qos,function(topic,payload,packet) {  
                    if (isUtf8(payload)) {
                        payload = payload.toString();
                    }
                    var msg = {topic:topic, payload:payload, qos: packet.qos, retain: packet.retain};
                    if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")){
                        msg._topic = topic;
                    }
                    //Prüfe, ob Nachricht Payload hat
                    if (msg.hasOwnProperty("payload")) {

                        if (typeof msg.payload === "string") {
                            //Versuche String zu parsen
                            try {
                                msg.payload = JSON.parse(msg.payload);
                                if(msg.payload.identifier == 'status'){
                                    node.send(msg);
                                }
                                
                            }
                            catch(e) {
                                node.error('Fehler ' + e.message,msg); 
                            }
                        }
                        else { 
                            node.warn(RED._("json.errors.dropped"));
                        }
                    }
                    //Falls kein Payload vorhanden, leite die Nachricht einfach so weiter
                    else { 
                        node.send(msg); 
                    }

                    
                }, this.id);
                
                if (this.brokerConn.connected) {
                    node.status({fill:"green",shape:"dot",text:"Verbunden"});
                }
            }
            else {
                this.error(RED._("mqtt.errors.not-defined"));
            }
            
            this.on('input', function (msg) {
                msg.qos = node.qos;
                msg.retain = 0;
                msg.topic = 'sub/Aktor/' + this.aktor + '/' + this.number;
                msg.payload = '{"identifier":"status"}';
                this.brokerConn.publish(msg);
                
            });
            
            
            
            
            this.on('close', function(done) {
                if (node.brokerConn) {
                    node.brokerConn.unsubscribe(node.topic,node.id);
                    node.brokerConn.deregister(node,done);
                }
            });
            
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
        
        
    }
    RED.nodes.registerType("AktorStatus", AktorStatusNode);


    function AktorNode(config) {
        
        RED.nodes.createNode(this,config);
        
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        this.aktor = RED.nodes.getNode(config.aktor).IoTAktorName;
        this.number = config.number;
        this.topic = 'sub/Aktor/' + this.aktor + '/' + this.number;
        this.qos = parseInt(config.qos);
        this.name = config.name;
        this.retain = config.retain;
        
        
                
        var node = this;
        

        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"Getrennt"});
            
            this.on("input",function(msg) {
                
                msg.qos = node.qos;
                msg.retain = node.retain;
                msg.topic = node.topic;

                if ( msg.hasOwnProperty("payload")) {
                    
                    if (msg.hasOwnProperty("topic") && (typeof msg.topic === "string") && (msg.topic !== "")) {
                        
                        if (typeof msg.payload === "string") {
                            //Versuche String zu parsen
                            try {
                                msg.payload = JSON.parse(msg.payload);
                                msg.payload.identifier = "data";
                                this.brokerConn.publish(msg);
                            }
                            catch(e) {
                                node.error('Fehler ' + e.message,msg); 
                            }
                        }
                        else if (typeof msg.payload === "object") {
                            if (!Buffer.isBuffer(msg.payload)) {
                                //versuche objekt zu parsen
                                try {
                                    msg.payload.identifier = "data";
                                    this.brokerConn.publish(msg);
                                }
                                catch(e) { 
                                    node.error(RED._("json.errors.dropped-error"));
                               }
                            }
                            else { 
                                node.warn(RED._("json.errors.dropped-object"));
                            }
                        }
                        else { 
                            node.warn(RED._("json.errors.dropped"));
                        }
                            
                }
                    
                    else { node.warn(RED._("mqtt.errors.invalid-topic")); }
                }
            });
            
            if (this.brokerConn.connected) {
                node.status({fill:"green",shape:"dot",text:"node-red:Verbunden"});
                node.log("Leuchte");
            }
            
            node.brokerConn.register(node);
            
            this.on('close', function(done) {
                node.brokerConn.deregister(node,done);
            });
            
        } else {
            this.error(RED._("mqtt.errors.missing-config"));
        }
    }
    RED.nodes.registerType("Aktor",AktorNode);
        
    function IoTAktorNode(n) {
        RED.nodes.createNode(this,n);
        this.IoTAktorName = n.IoTAktorName;
    }
    RED.nodes.registerType("IoT-Aktor", IoTAktorNode);
    
    
    function ConfigNode(n){
        
        RED.nodes.createNode(this,n);

        this.on('input', function (msg) {

            //msg.payload = "hallo";
            // in this example just send it straight on... should process it here really
            node.send(msg);    

        });
    }
    RED.nodes.registerType("Config", ConfigNode);
    
   function anNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // Store local copies of the node configuration (as defined in the .html)

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;
        
        // respond to inputs....
        this.on('input', function (msg) {
            var newMsg = {};
            newMsg.payload = JSON.parse('{"set_pwr":"on"}');
            node.send(newMsg);  
            /*
	
            if(typeof msg.payload === "object"){
                if(!Buffer.isBuffer(msg.payload)){
                    try{
                        msg.payload.set_pwr = "on";
                        node.send(msg);
                    }
                    catch(e){
                                //solte der Payload nicht geparsed weden
                                //können, dann den vorigen Payload ignorieren
                        var newPayload = '{"set_pwr":"on"}';
                        msg.payload = JSON.parse(newPayload);
                        node.send(msg);  
                    }
                }    
            } else {
                msg.payload = '{"set_pwr":"on"}';
               msg.payload = JSON.parse(msg.payload);
                // in this example just send it straight on... should process it here really
                node.send(msg);    
            }*/
        });

        this.on("close", function() {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("An",anNode);
    
    // require any external libraries we may need....
    //var foo = require("foo-library");

    // The main node definition - most things happen in here
    function ausNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // Store local copies of the node configuration (as defined in the .html)

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;
        
        // respond to inputs....
        this.on('input', function (msg) {
            var newMsg = {};
            newMsg.payload = JSON.parse('{"set_pwr":"off"}');
            node.send(newMsg);  
            /*
            if(typeof msg.payload === "object"){
                if(!Buffer.isBuffer(msg.payload)){
                    try{
                        msg.payload.set_pwr = "off";
                        node.send(msg);
                    }
                    catch(e){
                                //solte der Payload nicht geparsed weden
                                //können, dann den vorigen Payload ignorieren
                        var newPayload = '{"set_pwr":"off"}';
                        msg.payload = JSON.parse(newPayload);
                        node.send(msg);  
                    }
                }    
            } else {
                msg.payload = '{"set_pwr":"off"}';
               msg.payload = JSON.parse(msg.payload);
                // in this example just send it straight on... should process it here really
                node.send(msg);    
            }*/
        });

        this.on("close", function() {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("Aus",ausNode);



    
    // require any external libraries we may need....
    //var foo = require("foo-library");

    // The main node definition - most things happen in here
    function toggleNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // Store local copies of the node configuration (as defined in the .html)

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;
        
        // respond to inputs....
        this.on('input', function (msg) {
            var newMsg = {};
            newMsg.payload = JSON.parse('{"toggle":1}');
            node.send(newMsg);  
	       /*
            if(typeof msg.payload === "object"){
                if(!Buffer.isBuffer(msg.payload)){
                    try{
                        msg.payload.toggle = 1;
                        node.send(msg);
                    }
                    catch(e){
                                //solte der Payload nicht geparsed weden
                                //können, dann den vorigen Payload ignorieren
                        var newPayload = '{"toggle":1}';
                        msg.payload = JSON.parse(newPayload);
                        node.send(msg);  
                    }
                }    
            } else {
                msg.payload = '{"toggle":1}';
               msg.payload = JSON.parse(msg.payload);
                // in this example just send it straight on... should process it here really
                node.send(msg);    
            }*/
        });
    }
    

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("Toggle",toggleNode);


    // The main node definition - most things happen in here
    function rgbNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        
        if(n.rot > 255){
            this.rot = 255;
        } else if(n.rot < 0){
            this.rot = 0;      
        } else {
            this.rot = parseInt(n.rot);
        }
        
        if(n.gruen > 255){
            this.gruen = 255;
        } else if(n.gruen < 0){
            this.gruen = 0;      
        } else {
            this.gruen = parseInt(n.gruen);
        }
        
        if(n.blau > 255){
            this.blau = 255;
        } else if(n.blau < 0){
            this.blau = 0;      
        } else {
            this.blau = parseInt(n.blau);
        }
 
        var node = this;
        
        // respond to inputs....
        this.on('input', function (msg) {
		//wenn Eingang ein String ist: dies ist der FAll wenn man einen eigenen Input setzt
		//mittels mqtt Eingang oder Dashboard dings
        if(typeof msg.payload === "string"){
            if(msg.payload.includes("rgb")){
				var rgb = msg.payload.match(/\d+/g);
                var red = rgb[0];
                var green = rgb[1];
                var blue = rgb[2];
				
				var newPayload = '{"set_rgb":['+ red + ','+ green + ',' + blue + ']}';
                
                msg.payload = JSON.parse(newPayload);
                node.send(msg);            
            }
            else if(msg.payload.length == 6){        
            }
            else if(msg.payload.length == 7 && msg.payload.includes("#")){
                
                var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(msg.payload);
                if (result !== null){
                    var r = parseInt(result[1],16);
                    var g = parseInt(result[2],16);
                    var b = parseInt(result[3],16);
                    var newPayload = '{"set_rgb":['+ r + ','+ g + ',' + b + ']}';
                
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);  
                }
                
            }
            else if(msg.payload.length == 8 && msg.payload.includes('0x')){
                
            }
            else{
                var newPayload = '{"set_rgb":['+node.rot+','+node.gruen+',' +node.blau+ ']}';
                msg.payload = JSON.parse(newPayload);
                node.send(msg);    
            }
        }
        //diesen Typ hat man wenn man ein JSON Object weiter leitet,
        //Dies ist der Fall wenn man mit dem internen Protokoll arbeitet
        else if(typeof msg.payload === "object"){
            if(!Buffer.isBuffer(msg.payload)){
                try{
                    var rgb_array = [node.rot, node.gruen, node.blau];
                    msg.payload.set_rgb = rgb_array;
                    node.send(msg);
                }
                catch(e){
                            //solte der Payload nicht geparsed weden
                            //können, dann den vorigen Payload ignorieren
                    var newPayload = '{"set_rgb":['+node.rot+','+node.gruen+',' +node.blau+ ']}';
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);  
                        }
                }    
        }
        //alles andere: number, boolen etc...
        // der node gibt dann nur die WErte aus, die eingestellt
        // wurden
        else {
            var newPayload = '{"set_rgb":['+node.rot+','+node.gruen+',' +node.blau+ ']}';
            msg.payload = JSON.parse(newPayload);
            node.send(msg); 
        }
                    
        });

        this.on("close", function() {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        });
    }

    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("RGB",rgbNode);
    
    function brightnessNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        if(n.brightness > 100){
            this.brightness = 100;
        } else if(n.brightness < 0){
            this.brightness = 0;      
        } else {
            this.brightness = n.brightness;
        }
        var node = this;
        this.on('input', function (msg) {
            //wenn der Payload ein Object ist, dann ist 
            //die Nachricht sehr wahrscheinlich von intern
            //füge daher nun den helligkeitswert aus dem Node hinzu
                if(typeof msg.payload === 'object'){
                    if(!Buffer.isBuffer(msg.payload)){
                        try{
                            msg.payload.set_brightness = parseInt(node.brightness);
                            node.send(msg);
                        }
                        catch(e){
                            //solte der Payload nicht geparsed weden
                            //können, dann den vorigen Payload ignorieren
                            var newPayload = '{"set_brightness":'+node.brightness+'}';
                            msg.payload = JSON.parse(newPayload);
                            node.send(msg);  
                        }
                    }
                }
            

            // falls im Payload ein String steht
            // prüfe ob man diesne nicht als int darstellen kann
            // falls int möglich jedoch zu groß werden die Daten
            // verworfen
            else if(typeof msg.payload === 'string'){
                if(!isNaN(msg.payload)){
                    var helligkeit = parseInt(msg.payload);
                    if(helligkeit <= 100 && helligkeit >= 0){
                        node.brightness = helligkeit;
                    }
                    var newPayload = '{"set_brightness":'+node.brightness+'}';
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);
                //falls der string doch nur text war, dann
                //als payload die helligkeit aus dem node verweden
                } else {
                    var newPayload = '{"set_brightness":'+node.brightness+'}';
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);  
                }
                
            }
            //falls im Payload eine Nummer steht
            // prüfe ob diese zwischen 0..100 liegt
            // falls nicht werden die Daten im Node übertragen
            else if(typeof msg.payload === 'number'){
                if(msg.payload <= 100 && msg.payload >= 0){
                    var newPayload = '{"set_brightness":'+msg.payload+'}';
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);  
                } else {
                    //falls irgendeine zahl die kleiner als 0 und
                    //größer als 100 übergeben wurde, nimm die Daten
                    //aus dem Node
                    var newPayload = '{"set_brightness":'+node.brightness+'}';
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg); 
                }
            }
            //falls werder object, string oder number
            //nehme einfach die Daten aus dem Node
            else {
                var newPayload = '{"set_brightness":'+node.brightness+'}';
                msg.payload = JSON.parse(newPayload);
                node.send(msg);    
            }

        });
        
    }
    RED.nodes.registerType("Helligkeit",brightnessNode);
    
    function clickNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        var node = this;
        this.on('input', function (msg) {

                if(typeof msg.payload === 'object'){
                    if(msg.payload.clickEvent == "onSingleClick"){
                        node.send([msg, null, null, null]);
                    }else if(msg.payload.clickEvent == "onDoubleClick"){
                        node.send([null, msg, null, null]);
                    }else if(msg.payload.clickEvent == "onLongPress"){
                        node.send([null, null, msg, null]);
                    }else if(msg.payload.clickEvent == "onLongPressStop"){
                        node.send([null, null, null, msg]);    
                    } else {
                        //nichts machen         
                    }

                    }
        });
        
    }
    RED.nodes.registerType("Klick-Dekodierer",clickNode);

    function wetterNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        var node = this;
        this.on('input', function (msg) {
            if(typeof msg.payload === 'object' && msg.payload.identifier == "data"){
                var temp = 0;
                var hum = 0;
                var ldr = 0;
                var hi = 0;
                var msg1;
                var msg2;
                var msg3;
                var msg4;
                if(msg.payload.hasOwnProperty('Temp')){
                    msg1 = { payload: parseFloat(msg.payload.Temp)};
                }
                if(msg.payload.hasOwnProperty('Hum')){
                    msg2 = { payload: parseFloat(msg.payload.Hum)};
                }
                if(msg.payload.hasOwnProperty('LDR')){
                    msg3 ={ payload: parseInt(msg.payload.LDR)};
                }
                if(msg.payload.hasOwnProperty('HI')){
                   msg4 = { payload: parseFloat(msg.payload.HI)};
                }
                node.send([msg1, msg2, msg3, msg4]);
               }
        });
        
    }
    RED.nodes.registerType("Wetter-Dekodierer",wetterNode);
    
    
    
};
