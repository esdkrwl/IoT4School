
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

    function MQTTBrokerNode(n) {
        RED.nodes.createNode(this,n);

        // Konfigparameter aus Editor
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
        if (typeof this.usetls === 'undefined'){
            this.usetls = false;
        }
        if (typeof this.compatmode === 'undefined'){
            this.compatmode = true;
        }
        if (typeof this.verifyservercert === 'undefined'){
            this.verifyservercert = false;
        }
        if (typeof this.keepalive === 'undefined'){
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
        if (this.compatmode == "true" || this.compatmode === true){
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

        this.register = function(mqttNode){
            node.users[mqttNode.id] = mqttNode;
            if (Object.keys(node.users).length === 1) {
                node.connect();
            }
        };

        this.deregister = function(mqttNode,done){
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
                    if (node.connected){
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
                node.client.publish(msg.topic, msg.payload, options, function (err){return});
            }
        };

        this.on('close', function(done) {
            this.closing = true;
            if (this.connected) {
                this.client.once('close', function() {
                    done();
                });
                this.client.end();
            } else if (this.connecting) {
                node.client.end();
                done();
            } else {
                done();
            }
        });

    }

    RED.nodes.registerType("test-mqtt-broker",MQTTBrokerNode,{
        credentials: {
            user: {type:"text"},
            password: {type: "password"}
        }
    });

    function SensorNode(config) {
        RED.nodes.createNode(this,config);
        
        this.name = RED.nodes.getNode(config.name).inputDeviceName;
        this.count = config.count;
        //default params setzen

        this.topic = 'esp/sensor/' + this.name + this.count;

        this.qos = parseInt(config.qos);
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        
        this.parseJson = config.parseJson;
        
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
                    
                    if(node.parseJson){
                        //Prüfe, ob Nachricht Payload hat
                        if (msg.hasOwnProperty("payload")) {
                            if (typeof msg.payload === "string") {
                                //Versuche String zu parsen
                                try {
                                    msg.payload = JSON.parse(msg.payload);
                                    node.send(msg);
                                }
                                catch(e) {
                                    node.error('Fehler' + e.message,msg); 
                                }
                            }

                            else if (typeof msg.payload === "object") {
                                if (!Buffer.isBuffer(msg.payload)) {
                                    //versuche objekt zu parsen
                                    try {
                                        msg.payload = JSON.stringify(msg.payload);
                                        node.send(msg);
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
                        //Falls kein Payload vorhanden, leite die Nachricht einfach so weiter
                        else { 
                            node.send(msg); 
                        }   
                    }
                    //Falls JSON nicht geparst werden soll, leite die Nachricht einfach weiter
                    else{
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
    
    
    
    function InputDeviceNode(n) {
        RED.nodes.createNode(this,n);
        this.inputDeviceName = n.inputDeviceName;
    }
    RED.nodes.registerType("InputDevice",InputDeviceNode);



    function AktorNode(config) {
        
        RED.nodes.createNode(this,config);
        
        this.name = RED.nodes.getNode(config.name).outputDeviceName;
        this.count = config.count;
        
        this.topic = 'esp/aktor/' + this.name + this.count;
        
        this.parseJson = config.parseJson;
        
        this.qos = config.qos || null;
        this.broker = config.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        var node = this;

        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"Getrennt"});
            
            this.on("input",function(msg) {
                //Prüfe, ob qos in der Nachrichtig gesetzt ist
                if (msg.qos) {
                    msg.qos = parseInt(msg.qos);
                    if ((msg.qos !== 0) && (msg.qos !== 1) && (msg.qos !== 2)) {
                        msg.qos = null;
                    }
                }
                //Falls qos werder im Node, als in der Nachricht gesetzt sind, dann 0
                msg.qos = Number(node.qos || msg.qos || 0);
                //retain standardmäßig aus
                msg.retain = false;
                //prüfe, ob topic bereits definiert
                if (node.topic) {
                    msg.topic = node.topic;
                }
                //prüfe, ob Payload vorhanden
                if ( msg.hasOwnProperty("payload")) {
                    //Nachrichtig muss mindestens einen String als Topic enthalten und darf nicht leer sein
                    if (msg.hasOwnProperty("topic") && (typeof msg.topic === "string") && (msg.topic !== "")) {
                        
                        //Prüfe, ob uns JSON interessiert
                        if(node.parseJson){
                            if (typeof msg.payload === "string") {
                                //Versuche String zu parsen
                                try {
                                    msg.payload = JSON.parse(msg.payload);
                                    //msg.payload.data.push(idFlag);
                                    msg.payload.identifier = "data";
                                    this.brokerConn.publish(msg);
                                }
                                catch(e) {
                                    node.error('Fehler' + e.message,msg); 
                                }
                            }
                            else if (typeof msg.payload === "object") {
                                if (!Buffer.isBuffer(msg.payload)) {
                                    //versuche objekt zu parsen
                                    try {
                                        msg.payload = JSON.stringify(msg.payload);
                                        //msg.payload.data.push(idFlag);
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
                    //Falls uns JSON nicht interessiert, kann die Nachricht einfach so raus
                    else{
                        this.brokerConn.publish(msg);
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
    
    
    function OutputDeviceNode(n) {
        RED.nodes.createNode(this,n);
        this.outputDeviceName = n.outputDeviceName;
    }
    RED.nodes.registerType("OutputDevice", OutputDeviceNode);
    
    function StatusNode(n){
        RED.nodes.createNode(this,n);
 //      this.topic = n.topic;
        if(n.topic){
            this.topic = n.topic;
        } else {
            this.topic = 'esp/sensor/' + this.name;
        }

        this.qos = parseInt(n.qos);
        if (isNaN(this.qos) || this.qos < 0 || this.qos > 2) {
            this.qos = 2;
        }
        this.broker = n.broker;
        this.brokerConn = RED.nodes.getNode(this.broker);
        if (!/^(#$|(\+|[^+#]*)(\/(\+|[^+#]*))*(\/(\+|#|[^+#]*))?$)/.test(this.topic)) {
            return this.warn(RED._("mqtt.errors.invalid-topic"));
        }
        var node = this;
        if (this.brokerConn) {
            this.status({fill:"red",shape:"ring",text:"node-red:common.status.disconnected"});
            if (this.topic) {
                node.brokerConn.register(this);
                this.brokerConn.subscribe(this.topic,this.qos,function(topic,payload,packet) {
                    if (isUtf8(payload)) { payload = payload.toString(); }
                    var msg = {topic:topic,payload:payload, qos: packet.qos, retain: packet.retain};
                    if ((node.brokerConn.broker === "localhost")||(node.brokerConn.broker === "127.0.0.1")) {
                        msg._topic = topic;
                    }
                    node.send(msg);
                }, this.id);
                if (this.brokerConn.connected) {
                    node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
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
    RED.nodes.registerType("Status", StatusNode);
};
