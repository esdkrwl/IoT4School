
// ----------------------------- AB HIER BEGINNT DER IOT4SCHOOL-BLOCKCODE -----------------------------

Blockly.Python['iot_setup'] = function(block) {
  Blockly.Python.definitions_['import_verify_connection'] = 'from check_connect import verify_connection'; 
  var dict = "dict = {} #Bereitgestellt durch iot_setup-Block. Objekt wird fuer MQTT-Handling der einzelnen Module benoetigt";  
  Blockly.Python.definitions_['globalvar_dict'] = dict;

  var statements_setup_code = Blockly.Python.statementToCode(block, 'setup_code');
  var statements_loop_code = Blockly.Python.statementToCode(block, 'loop_code');
  
  // Fix für globale Variablen innerhalb einer Funktion
  // Code-Ausschnitt aus generators/python/procedures.js
  // Fügt ein 'global'- Statement für jede Variable, die über BIPES initialisiert wird, hinzu
  var globals = [];
  var workspace = block.workspace;
  var variables = Blockly.Variables.allUsedVarModels(workspace) || [];
  for (var i = 0, variable; (variable = variables[i]); i++) {
    var varName = variable.name;
    if (block.getVars().indexOf(varName) == -1) {
      globals.push(Blockly.Python.nameDB_.getName(varName,
          Blockly.VARIABLE_CATEGORY_NAME));
    }
  }
  globals = globals.length ? Blockly.Python.INDENT + 'global ' + globals.join(', ') + '\n' : '';	
  // Add developer variables.
  var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (var i = 0; i < devVarList.length; i++) {
    globals.push(Blockly.Python.nameDB_.getName(devVarList[i],
      Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  }
  // Ende vom Code aus generators/python/procedures.js
  
  // Alle Blöcke aus dem aktuellen Workspace bekommen
  var blocks = workspace.getAllBlocks()
  var code = '# setup-Funktion\n';
  code += 'def setup():\n'; 
  code += Blockly.Python.INDENT + 'global dict\n' + globals + statements_setup_code; 
  // Funktion, die das dict-Objekt mit den Variablen-Namen der Module befüllt (wird für den Callback-Handler benötigt)
  // z.B. dict[i] = i
  for(var i=0;i<blocks.length; i++) {
    switch(blocks[i].type)
    {
      case 'iot_rgb_led_init':
      case 'iot_smart_button_init':
      case 'iot_buzzer_init':
      case 'iot_dht_init':
      case 'iot_sht_init':
      case 'iot_pir_init':
      case 'iot_motor_init':
        var variable_name = (Blockly.Python.nameDB_.getName(blocks[i].getFieldValue('NAME'), Blockly.Variables.NAME_TYPE));
        code += Blockly.Python.INDENT + 'dict[' + variable_name + '] = ' + variable_name + '\n';
        break;
    }
  }
  code += '\n';
  code += '# loop-Funktion\n';
  code += 'def loop():\n' + Blockly.Python.INDENT + 'global dict\n' + globals + Blockly.Python.INDENT + 'verify_connection(network_manager) # Bereitgestellt durch iot_setup-Block. Prueft kontinuierlich WLAN- und MQTT-Verbindung\n';
  
  // Funktion, um zu schauen, ob bestimmte Blocktypen auftauchen, die ein besonderes Handling in der Hauptschleife benötigen
  // z.b. button.tick() für ein Button Modul
  for(var i=0;i<blocks.length; i++) {
    switch(blocks[i].type)
    {
      case 'iot_smart_button_init':
        var variable_name = (Blockly.Python.nameDB_.getName(blocks[i].getFieldValue('NAME'), Blockly.Variables.NAME_TYPE));
        code += Blockly.Python.INDENT + variable_name + '.button.tick()\n';
        break;
      case 'iot_pir_init':
      case 'iot_dht_init':
      case 'iot_sht_init':
        var variable_name = (Blockly.Python.nameDB_.getName(blocks[i].getFieldValue('NAME'), Blockly.Variables.NAME_TYPE));
        code += Blockly.Python.INDENT + variable_name + '.check()\n';
        break;
    }
  }

  code += statements_loop_code + '\n';
  code += '# Bereitgestellt durch iot_setup-Block\n'
  code += '# Hier wird die Funktion "setup" 1x ausgefuehrt und die Funktion "loop" laeuft, bis das Programm manuell abgebrochen wird\n';
  code += 'setup()\n' + 'while True:\n';
  code += Blockly.Python.INDENT + 'loop()\n';
  return code;

  // Wenn dieser Validierer implementiert wird, wird geprüft, ob alle Werte von diesem Block
  // sowie von ALLEN verknüpften Blöcken ausgefüllt sind
  // nicht brauchbar, da 1-2 Blöcke mit optionalem Wert 
  //if (!this.allInputsFilled()) {
    //block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
    //console.log('not filled');
  //} else {
    //block.setWarningText();
    //console.log('filled');
  //} 
};

// Hier folgt der Generator Code für die ganzen Setter
Blockly.Python['iot_rgb_led_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  
  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_smart_button_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  
  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_buzzer_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  
  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_dht_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);

  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_sht_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);

  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_pir_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);

  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_motor_get_module_id'] = function(block) {
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  
  var code = variable_name;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

// Ab hier beginnen die Blöcke, die in den jeweiligen Kategorien der Toolbox angezeigt werden
Blockly.Python['iot_rgb_led_init'] = function(block) {
  Blockly.Python.definitions_['import_RGB-LED'] = 'from module_RGB_LED import RGB_LED';
  
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  var value_number = Blockly.Python.valueToCode(block, 'number', Blockly.Python.ORDER_ATOMIC);
  
  // Validierung Werte der Input-Felder
  // Wenn LED-Anzahl kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_number < '1') {
    this.getInputTargetBlock('number').setFieldValue(1, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_number)) {
    this.getInputTargetBlock('number').setFieldValue(Math.trunc(value_number), 'NUM');
  }
  var code = variable_name + ' = RGB_LED(' + '\''  + variable_name + '\'' + ', ' + value_pin + ', ' + value_number + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_rgb_led_set_color'] = function(block) {
  var value_rgb_led_module_id = Blockly.Python.valueToCode(block, 'rgb_led_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_color = Blockly.Python.valueToCode(block, 'color', Blockly.Python.ORDER_ATOMIC);
  var value_led = Blockly.Python.valueToCode(block, 'led', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('rgb_led_module_id') || !this.getInputTargetBlock('color')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }
  
  if (value_led == '') {
    var code = value_rgb_led_module_id + '.set_color(' + value_color + ')\n';
  } else {
    var code = value_rgb_led_module_id + '.set_color(' + value_color + ', ' + value_led + ')\n';
  }
  return code;
};

// Blockcode von BIPES kopiert
Blockly.Python['iot_rgb_led_color_colors'] = function(block) {
  var color = block.getFieldValue('color');
  var h = Tool.HEX2RGB(color);
  
  var code = `${h.r},${h.g},${h.b}`;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

// Blockcode von BIPES kopiert
Blockly.Python['iot_rgb_led_color_numbers'] = function(block) {
  var value_red = Blockly.Python.valueToCode(block, 'red', Blockly.Python.ORDER_ATOMIC);
  var value_green = Blockly.Python.valueToCode(block, 'green', Blockly.Python.ORDER_ATOMIC);
  var value_blue = Blockly.Python.valueToCode(block, 'blue', Blockly.Python.ORDER_ATOMIC);

  // Validierung Werte der Input-Felder
  // Wenn Rot-Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
  if (value_red < '0') {
    this.getInputTargetBlock('red').setFieldValue(0, 'NUM');
  // Wenn Rot-Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_red > 255) {
    this.getInputTargetBlock('red').setFieldValue(255, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_red)) {
    this.getInputTargetBlock('red').setFieldValue(Math.trunc(value_red), 'NUM');
  }
  // Wenn Grün-Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
  if (value_green < '0') {
    this.getInputTargetBlock('green').setFieldValue(0, 'NUM');
  // Wenn Grün-Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_green > 255) {
    this.getInputTargetBlock('green').setFieldValue(255, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_green)) {
    this.getInputTargetBlock('green').setFieldValue(Math.trunc(value_green), 'NUM');
  }
  // Wenn Blau-Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
  if (value_blue < '0') {
    this.getInputTargetBlock('blue').setFieldValue(0, 'NUM');
  // Wenn Blau-Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_blue > 255) {
    this.getInputTargetBlock('blue').setFieldValue(255, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_blue)) {
    this.getInputTargetBlock('blue').setFieldValue(Math.trunc(value_blue), 'NUM');
  } 

  // Style block with compiled values, see block_definitions.js
  this.styleBlock([value_red, value_green, value_blue]);

  var code = `${value_red},${value_green},${value_blue}`;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_rgb_led_set_brightness'] = function(block) {
  var value_rgb_led_module_id = Blockly.Python.valueToCode(block, 'rgb_led_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_brightness = Blockly.Python.valueToCode(block, 'brightness', Blockly.Python.ORDER_ATOMIC);
   
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('rgb_led_module_id') || !this.getInputTargetBlock('brightness')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
  if (value_brightness < '0') {
    //var test = this.getInputTargetBlock('brightness').getFieldValue('NUM');
    this.getInputTargetBlock('brightness').setFieldValue(0, 'NUM');
    //console.log(firstChild);
  // Wenn Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_brightness > 100) {
    this.getInputTargetBlock('brightness').setFieldValue(100, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_brightness)) {
    this.getInputTargetBlock('brightness').setFieldValue(Math.trunc(value_brightness), 'NUM');
  }
  
  var code = value_rgb_led_module_id + '.set_brightness(' + value_brightness + ')\n';
  return code;
};

Blockly.Python['iot_rgb_led_set_enabled'] = function(block) {
  var value_rgb_led_module_id = Blockly.Python.valueToCode(block, 'rgb_led_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('rgb_led_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_rgb_led_module_id + '.set_enabled()\n';
  return code;
};

Blockly.Python['iot_rgb_led_set_disabled'] = function(block) {
  var value_rgb_led_module_id = Blockly.Python.valueToCode(block, 'rgb_led_module_id', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('rgb_led_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_rgb_led_module_id + '.set_disabled()\n';
  return code;
};

Blockly.Python['iot_rgb_led_toggle'] = function(block) {
  var value_rgb_led_module_id = Blockly.Python.valueToCode(block, 'rgb_led_module_id', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('rgb_led_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  } 

  var code = value_rgb_led_module_id + '.toggle()\n';
  return code;
};

Blockly.Python['iot_smart_button_init'] = function(block) {
  Blockly.Python.definitions_['import_Smart_Button'] = 'from module_Smart_Button import Smart_Button';
  
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');

  var code = variable_name + ' = Smart_Button(' + '\''  + variable_name + '\'' + ', ' + value_pin + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_smart_button_set_ticks'] = function(block) {
  var value_smart_button_module_id = Blockly.Python.valueToCode(block, 'smart_button_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_ticks = Blockly.Python.valueToCode(block, 'ticks', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('smart_button_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_ticks < '1') {
    this.getInputTargetBlock('ticks').setFieldValue(1, 'NUM');
  // Wenn Wert größer als 1000, dann wird Zahl auf 1000 gesetzt
  } else if (value_ticks > 1000) {
    this.getInputTargetBlock('ticks').setFieldValue(1000, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_ticks)) {
    this.getInputTargetBlock('ticks').setFieldValue(Math.trunc(value_ticks), 'NUM');
  }

  var code = value_smart_button_module_id + '.set_ticks(' + value_ticks + ')\n';
  return code;
};

Blockly.Python['iot_smart_button_set_press_ticks'] = function(block) {
  var value_smart_button_module_id = Blockly.Python.valueToCode(block, 'smart_button_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_press_ticks = Blockly.Python.valueToCode(block, 'press_ticks', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('smart_button_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_press_ticks < '1') {
    this.getInputTargetBlock('press_ticks').setFieldValue(1, 'NUM');
  // Wenn Wert größer als 2000, dann wird Zahl auf 2000 gesetzt
  } else if (value_press_ticks > 2000) {
    this.getInputTargetBlock('press_ticks').setFieldValue(2000, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_press_ticks)) {
    this.getInputTargetBlock('press_ticks').setFieldValue(Math.trunc(value_press_ticks), 'NUM');
  }

  var code = value_smart_button_module_id + '.set_press_ticks(' + value_press_ticks + ')\n';
  return code;
};

Blockly.Python['iot_smart_button_reset_total_clicks'] = function(block) {
  var value_smart_button_module_id = Blockly.Python.valueToCode(block, 'smart_button_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('smart_button_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_smart_button_module_id + '.reset_total_clicks()\n';
  return code;
};

Blockly.Python['iot_smart_button_get_total_clicks'] = function(block) {
  var value_smart_button_module_id = Blockly.Python.valueToCode(block, 'smart_button_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('smart_button_module_id')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_smart_button_module_id + '.get_total_clicks()';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_buzzer_init'] = function(block) {
  Blockly.Python.definitions_['import_Buzzer'] = 'from module_Buzzer import Buzzer';

  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  
  var code = variable_name + ' = Buzzer(' + '\''  + variable_name + '\'' + ', ' + value_pin + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_buzzer_set_volume'] = function(block) {
  var value_buzzer_module_id = Blockly.Python.valueToCode(block, 'buzzer_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_volume = Blockly.Python.valueToCode(block, 'volume', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('buzzer_module_id') || !this.getInputTargetBlock('volume')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
  if (value_volume < '0') {
    this.getInputTargetBlock('volume').setFieldValue(0, 'NUM');
  // Wenn Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_volume > 100) {
    this.getInputTargetBlock('volume').setFieldValue(100, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_volume)) {
    this.getInputTargetBlock('volume').setFieldValue(Math.trunc(value_volume), 'NUM');
  }

  var code = value_buzzer_module_id + '.set_volume(' + value_volume + ')\n';
  return code;
};

Blockly.Python['iot_buzzer_play_tone'] = function(block) {
  var value_buzzer_module_id = Blockly.Python.valueToCode(block, 'buzzer_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_frequency = Blockly.Python.valueToCode(block, 'frequency', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('buzzer_module_id') || !this.getInputTargetBlock('frequency')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_frequency < '1') {
    this.getInputTargetBlock('frequency').setFieldValue(1, 'NUM');
  // Wenn Wert größer als 1000, dann wird Zahl auf 1000 gesetzt
  } else if (value_frequency > 1000) {
    this.getInputTargetBlock('frequency').setFieldValue(1000, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_frequency)) {
    this.getInputTargetBlock('frequency').setFieldValue(Math.trunc(value_frequency), 'NUM');
  }

  var code = value_buzzer_module_id + '.play_tone(' + value_frequency + ')\n';
  return code;
};

Blockly.Python['iot_buzzer_tone_type'] = function(block) {
  var dropdown_tone = block.getFieldValue('tone');
  var code = dropdown_tone;
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_buzzer_play_song'] = function(block) {
  var value_buzzer_module_id = Blockly.Python.valueToCode(block, 'buzzer_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_rtttl_string = Blockly.Python.valueToCode(block, 'rtttl_string', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('buzzer_module_id') || !this.getInputTargetBlock('rtttl_string')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_buzzer_module_id + '.play_song(' + value_rtttl_string + ')\n';
  return code;
};

Blockly.Python['iot_buzzer_play_song_from_file'] = function(block) {
  var value_buzzer_module_id = Blockly.Python.valueToCode(block, 'buzzer_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_rtttl_songname = Blockly.Python.valueToCode(block, 'rtttl_songname', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('buzzer_module_id') || !this.getInputTargetBlock('rtttl_songname')) {
    //console.log('not filled');
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    //console.log('filled');
    block.setWarningText();
  }

  var code = value_buzzer_module_id + '.play_song_from_file(' + value_rtttl_songname + ')\n';
  return code;
};

Blockly.Python['iot_dht_init'] = function(block) {
  Blockly.Python.definitions_['import_DHT'] = 'from module_DHT import DHT';

  var dropdown_type = block.getFieldValue('type');
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  
  // Hier wird geschaut, welche Dropdown-Option gewählt wurde und dementsprechend das Bild angepasst
  var dht_type = this.getField('type').getValue();
  if (dht_type == 'dht11') {
    this.getField('IMAGE').setValue("/iot_img/dht11.png");
  } else {
    this.getField('IMAGE').setValue("/iot_img/dht22.png");
  }

  var code = variable_name + ' = DHT(' + '\''  + variable_name + '\'' + ', ' + value_pin + ', ' + '\''  + dropdown_type + '\'' + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_sht_init'] = function(block) {
  Blockly.Python.definitions_['import_SHT3x'] = 'from module_SHT3x import SHT3x';

  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_i2c = Blockly.Python.valueToCode(block, 'i2c', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  var value_scl = Blockly.Python.valueToCode(block, 'scl', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  var value_sda = Blockly.Python.valueToCode(block, 'sda', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');

  // Validierung der I2C-Adresse
  if (value_i2c != 68 && value_i2c != 69) {
    block.setWarningText("Warnung: SHT30 verwendet nur die Adressen 0x45 (69) und 0x44 (68)!");  
  } else {
    block.setWarningText();
  }

  var code = variable_name + ' = SHT3x(' + '\''  + variable_name + '\'' + ', ' + value_scl + ', ' + value_sda + ', ' + value_i2c + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_dsht_set_enabled'] = function(block) {
  var value_dsht_module_id = Blockly.Python.valueToCode(block, 'dsht_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('dsht_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_dsht_module_id + '.set_enabled()\n';
  return code;
};

Blockly.Python['iot_dsht_set_disabled'] = function(block) {
  var value_dsht_module_id = Blockly.Python.valueToCode(block, 'dsht_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('dsht_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_dsht_module_id + '.set_disabled()\n';
  return code;
};

Blockly.Python['iot_dsht_set_debounce_time'] = function(block) {
  var value_dsht_module_id = Blockly.Python.valueToCode(block, 'dsht_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_debounce = Blockly.Python.valueToCode(block, 'debounce', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('dsht_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_debounce < '1') {
    this.getInputTargetBlock('debounce').setFieldValue(1, 'NUM');
  // Wenn Wert größer als 3600, dann wird Zahl auf 3600 gesetzt
  } else if (value_debounce > 3600) {
    this.getInputTargetBlock('debounce').setFieldValue(3600, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_debounce)) {
    this.getInputTargetBlock('debounce').setFieldValue(Math.trunc(value_debounce), 'NUM');
  }

  var code = value_dsht_module_id + '.set_debounce_time(' + value_debounce + ')\n';
  return code;
};

Blockly.Python['iot_dsht_get_temperature'] = function(block) {
  var value_dsht_module_id = Blockly.Python.valueToCode(block, 'dsht_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('dsht_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_dsht_module_id + '.get_temperature()';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_dsht_get_humidity'] = function(block) {
  var value_dsht_module_id = Blockly.Python.valueToCode(block, 'dsht_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('dsht_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_dsht_module_id + '.get_humidity()';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_pir_init'] = function(block) {
  Blockly.Python.definitions_['import_PIR'] = 'from module_PIR import PIR';

  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_pin = Blockly.Python.valueToCode(block, 'pin', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');

  var code = variable_name + ' = PIR(' + '\''  + variable_name + '\'' + ', ' + value_pin + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_pir_set_enabled'] = function(block) {
  var value_pir_module_id = Blockly.Python.valueToCode(block, 'pir_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('pir_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_pir_module_id + '.set_enabled()\n';
  return code;
};

Blockly.Python['iot_pir_set_disabled'] = function(block) {
  var value_pir_module_id = Blockly.Python.valueToCode(block, 'pir_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('pir_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_pir_module_id + '.set_disabled()\n';
  return code;
};

Blockly.Python['iot_pir_set_debounce_time'] = function(block) {
  var value_pir_module_id = Blockly.Python.valueToCode(block, 'pir_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_debounce = Blockly.Python.valueToCode(block, 'debounce', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('pir_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als 1, dann wird Zahl auf 1 gesetzt
  if (value_debounce < '1') {
    this.getInputTargetBlock('debounce').setFieldValue(1, 'NUM');
  // Wenn Wert größer als 3600, dann wird Zahl auf 3600 gesetzt
  } else if (value_debounce > 3600) {
    this.getInputTargetBlock('debounce').setFieldValue(3600, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_debounce)) {
    this.getInputTargetBlock('debounce').setFieldValue(Math.trunc(value_debounce), 'NUM');
  }

  var code = value_pir_module_id + '.set_debounce_time(' + value_debounce + ')\n';
  return code;
};

Blockly.Python['iot_pir_reset_total_alarms'] = function(block) {
  var value_pir_module_id = Blockly.Python.valueToCode(block, 'pir_module_id', Blockly.Python.ORDER_ATOMIC);

   // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('pir_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_pir_module_id + '.reset_total_alarms()\n';
  return code;
};

Blockly.Python['iot_pir_get_total_alarms'] = function(block) {
  var value_pir_module_id = Blockly.Python.valueToCode(block, 'pir_module_id', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('pir_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  var code = value_pir_module_id + '.get_total_alarms()';
  return [code, Blockly.Python.ORDER_ATOMIC];
};

Blockly.Python['iot_mqtt_set_callback'] = function(block) {
  var variable_topic = Blockly.Python.nameDB_.getName(block.getFieldValue('topic'), Blockly.VARIABLE_CATEGORY_NAME);
  var variable_msg = Blockly.Python.nameDB_.getName(block.getFieldValue('msg'), Blockly.VARIABLE_CATEGORY_NAME);
  var retain = Blockly.Python.nameDB_.getName(block.getFieldValue('retain'), Blockly.VARIABLE_CATEGORY_NAME);
  var duplicate = Blockly.Python.nameDB_.getName(block.getFieldValue('duplicate'), Blockly.VARIABLE_CATEGORY_NAME);
  // Fix für globale Variablen innerhalb einer Funktion
  // Code-Ausschnitt aus generators/python/procedures.js
  // Fügt ein 'global'- Statement für jede Variable, die über BIPES initialisiert wird, hinzu
  var globals = [];
  var workspace = block.workspace;
  var variables = Blockly.Variables.allUsedVarModels(workspace) || [];
  for (var i = 0, variable; (variable = variables[i]); i++) {
    var varName = variable.name;
    if (block.getVars().indexOf(varName) == -1 && varName != variable_topic && varName != variable_msg) {
      globals.push(Blockly.Python.nameDB_.getName(varName,
          Blockly.VARIABLE_CATEGORY_NAME));
    }
  }	
  // Add developer variables.
  var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  for (var i = 0; i < devVarList.length; i++) {
    globals.push(Blockly.Python.nameDB_.getName(devVarList[i],
      Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  }
  globals = globals.length ? Blockly.Python.INDENT + 'global ' + globals.join(', ') + '\n' : '';
  // Ende vom Code aus generators/python/procedures.js

  var function_code = Blockly.Python.statementToCode(block, 'do');


  var function_name = Blockly.Python.provideFunction_(
    'mqtt_callback',
    ['def ' + Blockly.Python.FUNCTION_NAME_PLACEHOLDER_ + '(' + variable_topic + ', ' + variable_msg + ', ' + retain + ', ' + duplicate + '):',
    globals + Blockly.Python.INDENT + variable_msg + " = " + variable_msg  + ".decode()", function_code]);

var code = 'network_manager.mqtt_client.set_callback(' + function_name + ')\n';
return code;
}

Blockly.Python['iot_mqtt_subscribe'] = function(block) {
  var value_topic = Blockly.Python.valueToCode(block, 'topic', Blockly.Python.ORDER_ATOMIC);

  var code = 'network_manager.mqtt_client.subscribe(' + value_topic + ')\n';
  return code;
};

Blockly.Python['iot_mqtt_publish'] = function(block) {
  var value_topic = Blockly.Python.valueToCode(block, 'topic', Blockly.Python.ORDER_ATOMIC);
  var value_msg = Blockly.Python.valueToCode(block, 'msg', Blockly.Python.ORDER_ATOMIC);
  var dropdown_qos_lvl = block.getFieldValue('qos_lvl');

  var code = 'network_manager.mqtt_client.publish(' + value_topic + ', ' + value_msg + ', False, ' + dropdown_qos_lvl + ')\n';
  return code;
};

Blockly.Python['iot_motor_init'] = function(block) {
  Blockly.Python.definitions_['import_Motor'] = 'from module_Motor import Motor';
  
  var variable_name = Blockly.Python.nameDB_.getName(block.getFieldValue('NAME'), Blockly.Variables.NAME_TYPE);
  var value_i2c = Blockly.Python.valueToCode(block, 'i2c', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  var value_scl = Blockly.Python.valueToCode(block, 'scl', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');
  var value_sda = Blockly.Python.valueToCode(block, 'sda', Blockly.Python.ORDER_ATOMIC).replace('(','').replace(')','');

  // Validierung der I2C-Adresse
  if (value_i2c < 45 || value_i2c > 48) {
    block.setWarningText("Warnung: Motor HW-648 verwendet nur die Adressen 0x30 (48), 0x2D (45), 0x2E (46) und 0x2F (47)!");  
  } else {
    block.setWarningText();
  }

  var code = variable_name + ' = Motor(' + '\''  + variable_name + '\'' + ', ' + value_scl + ', ' + value_sda + ', ' + value_i2c + ', network_manager.mqtt_client, network_manager.device_id)\n';
  return code;
};

Blockly.Python['iot_motor_set_enabled'] = function(block) {
  var value_motor_module_id = Blockly.Python.valueToCode(block, 'motor_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_motor_index = Blockly.Python.valueToCode(block, 'motor_index', Blockly.Python.ORDER_ATOMIC);

  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('motor_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  if (value_motor_index == '') {
    var code = value_motor_module_id + '.set_enabled()\n';
  } else {
    // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
    if (value_motor_index < '0') {
      this.getInputTargetBlock('motor_index').setFieldValue(0, 'NUM');
    // Wenn Wert größer als 1, dann wird Zahl auf 1 gesetzt
    } else if (value_motor_index > 1) {
      this.getInputTargetBlock('motor_index').setFieldValue(1, 'NUM');
    // Wenn kein Integer, dann werden die Nachkommastellen entfernt
    } else if (!Number.isInteger(value_motor_index)) {
      this.getInputTargetBlock('motor_index').setFieldValue(Math.trunc(value_motor_index), 'NUM');
    }
    var code = value_motor_module_id + '.set_enabled(' + value_motor_index + ')\n';
  } 
  return code;
};

Blockly.Python['iot_motor_set_disabled'] = function(block) {
  var value_motor_module_id = Blockly.Python.valueToCode(block, 'motor_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_motor_index = Blockly.Python.valueToCode(block, 'motor_index', Blockly.Python.ORDER_ATOMIC);

   // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('motor_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  if (value_motor_index == '') {
    var code = value_motor_module_id + '.set_enabled()\n';
  } else {
    // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
    if (value_motor_index < '0') {
      this.getInputTargetBlock('motor_index').setFieldValue(0, 'NUM');
    // Wenn Wert größer als 1, dann wird Zahl auf 1 gesetzt
    } else if (value_motor_index > 1) {
      this.getInputTargetBlock('motor_index').setFieldValue(1, 'NUM');
    // Wenn kein Integer, dann werden die Nachkommastellen entfernt
    } else if (!Number.isInteger(value_motor_index)) {
      this.getInputTargetBlock('motor_index').setFieldValue(Math.trunc(value_motor_index), 'NUM');
    }
    var code = value_motor_module_id + '.set_disabled(' + value_motor_index + ')\n';
  } 
  return code;
};

Blockly.Python['iot_motor_toggle'] = function(block) {
  var value_motor_module_id = Blockly.Python.valueToCode(block, 'motor_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_motor_index = Blockly.Python.valueToCode(block, 'motor_index', Blockly.Python.ORDER_ATOMIC);

   // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('motor_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  if (value_motor_index == '') {
    var code = value_motor_module_id + '.set_enabled()\n';
  } else {
    // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
    if (value_motor_index < '0') {
      this.getInputTargetBlock('motor_index').setFieldValue(0, 'NUM');
    // Wenn Wert größer als 1, dann wird Zahl auf 1 gesetzt
    } else if (value_motor_index > 1) {
      this.getInputTargetBlock('motor_index').setFieldValue(1, 'NUM');
    // Wenn kein Integer, dann werden die Nachkommastellen entfernt
    } else if (!Number.isInteger(value_motor_index)) {
      this.getInputTargetBlock('motor_index').setFieldValue(Math.trunc(value_motor_index), 'NUM');
    }
    var code = value_motor_module_id + '.toggle(' + value_motor_index + ')\n';
  } 
  return code;
};

Blockly.Python['iot_motor_set_speed'] = function(block) {
  var value_motor_module_id = Blockly.Python.valueToCode(block, 'motor_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_speed = Blockly.Python.valueToCode(block, 'speed', Blockly.Python.ORDER_ATOMIC);
  var value_motor_index = Blockly.Python.valueToCode(block, 'motor_index', Blockly.Python.ORDER_ATOMIC);
  
  // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('motor_module_id') || !this.getInputTargetBlock('speed')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  // Wenn Wert kleiner als -100, dann wird Zahl auf -100 gesetzt
  if (value_speed < '-100') {
    this.getInputTargetBlock('speed').setFieldValue(-100, 'NUM');
    //console.log(firstChild);
  // Wenn Wert größer als 100, dann wird Zahl auf 100 gesetzt
  } else if (value_speed > 100) {
    this.getInputTargetBlock('speed').setFieldValue(100, 'NUM');
  // Wenn kein Integer, dann werden die Nachkommastellen entfernt
  } else if (!Number.isInteger(value_speed)) {
    this.getInputTargetBlock('speed').setFieldValue(Math.trunc(value_speed), 'NUM');
  }

  if (value_motor_index == '') {
    var code = value_motor_module_id + '.set_enabled()\n';
  } else {
    // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
    if (value_motor_index < '0') {
      this.getInputTargetBlock('motor_index').setFieldValue(0, 'NUM');
    // Wenn Wert größer als 1, dann wird Zahl auf 1 gesetzt
    } else if (value_motor_index > 1) {
      this.getInputTargetBlock('motor_index').setFieldValue(1, 'NUM');
    // Wenn kein Integer, dann werden die Nachkommastellen entfernt
    } else if (!Number.isInteger(value_motor_index)) {
      this.getInputTargetBlock('motor_index').setFieldValue(Math.trunc(value_motor_index), 'NUM');
    }
    var code = value_motor_module_id + '.brake(' + value_motor_index + ')\n';
  } 
  return code;
};

Blockly.Python['iot_motor_brake'] = function(block) {
  var value_motor_module_id = Blockly.Python.valueToCode(block, 'motor_module_id', Blockly.Python.ORDER_ATOMIC);
  var value_motor_index = Blockly.Python.valueToCode(block, 'motor_index', Blockly.Python.ORDER_ATOMIC);

   // Blockvalidierung, ob alle benötigten Input-Felder gesetzt/gefüllt sind
  if (!this.getInputTargetBlock('motor_module_id')) {
    block.setWarningText("Nicht alle benÃ¶tigten Werte ausgefÃ¼llt!");
  } else {
    block.setWarningText();
  }

  // Validierung Werte der Input-Felder
  if (value_motor_index == '') {
    var code = value_motor_module_id + '.set_enabled()\n';
  } else {
    // Wenn Wert kleiner als 0, dann wird Zahl auf 0 gesetzt
    if (value_motor_index < '0') {
      this.getInputTargetBlock('motor_index').setFieldValue(0, 'NUM');
    // Wenn Wert größer als 1, dann wird Zahl auf 1 gesetzt
    } else if (value_motor_index > 1) {
      this.getInputTargetBlock('motor_index').setFieldValue(1, 'NUM');
    // Wenn kein Integer, dann werden die Nachkommastellen entfernt
    } else if (!Number.isInteger(value_motor_index)) {
      this.getInputTargetBlock('motor_index').setFieldValue(Math.trunc(value_motor_index), 'NUM');
    }
    var code = value_motor_module_id + '.brake(' + value_motor_index + ')\n';
  } 
  return code;
};
