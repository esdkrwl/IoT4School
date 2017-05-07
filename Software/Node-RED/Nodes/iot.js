/**
 * Copyright JS Foundation and other contributors, http://js.foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

// If you use this as a template, update the copyright with your own name.

// Sample Node-RED node file


module.exports = function(RED) {
    "use strict";
    // require any external libraries we may need....
    //var foo = require("foo-library");

    // The main node definition - most things happen in here
    function anNode(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);

        // Store local copies of the node configuration (as defined in the .html)

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;
        
        // respond to inputs....
        this.on('input', function (msg) {
	
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
            }
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
				
				var newPayload = '{"rgb":['+ red + ','+ green + ',' + blue + ']}';
                
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
                    var newPayload = '{"rgb":['+ r + ','+ g + ',' + b + ']}';
                
                    msg.payload = JSON.parse(newPayload);
                    node.send(msg);  
                }
                
            }
            else if(msg.payload.length == 8 && msg.payload.includes('0x')){
                
            }
            else{
                var newPayload = '{"rgb":['+node.rot+','+node.gruen+',' +node.blau+ ']}';
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
                    msg.payload.rgb = rgb_array;
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
        //alles andere: number, boolen etc...
        // der node gibt dann nur die WErte aus, die eingestellt
        // wurden
        else {
            var newPayload = '{"rgb":['+node.rot+','+node.gruen+',' +node.blau+ ']}';
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
    RED.nodes.registerType("Brightness",brightnessNode);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
};
