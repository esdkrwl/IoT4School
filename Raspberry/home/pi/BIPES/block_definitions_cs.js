
// ----------------------------- AB HIER BEGINNEN DIE IOT4SCHOOL-BLOCKDEFINITIONEN -----------------------------

// Typed variable getter rgb_led
Blockly.Blocks['iot_rgb_led_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['rgb_led'], 'rgb_led'), "NAME")
        .appendField("(RGB_LED)");
    this.setOutput(true, "rgb_led");
    this.setColour(0);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter smart_button
Blockly.Blocks['iot_smart_button_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['smart_button'], 'smart_button'), "NAME")
        .appendField("(Smart_Button)");
    this.setOutput(true, "smart_button");
    this.setColour(45);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter buzzer
Blockly.Blocks['iot_buzzer_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['buzzer'], 'buzzer'), "NAME")
        .appendField("(Buzzer)");
    this.setOutput(true, "buzzer");
    this.setColour(330);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter dht
Blockly.Blocks['iot_dht_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['dht'], 'dht'), "NAME")
        .appendField("(DHT)");
    this.setOutput(true, "dht");
    this.setColour(210);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter sht
Blockly.Blocks['iot_sht_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['sht'], 'sht'), "NAME")
        .appendField("(SHT)");
    this.setOutput(true, "sht");
    this.setColour(210);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter pir
Blockly.Blocks['iot_pir_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['pir'], 'pir'), "NAME")
        .appendField("(PIR)");
    this.setOutput(true, "pir");
    this.setColour(255);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

// Typed variable getter motor
Blockly.Blocks['iot_motor_get_module_id'] = {
  init: function() {
    this.appendDummyInput()
        .appendField(new Blockly.FieldVariable("", null, ['motor'], 'motor'), "NAME")
        .appendField("(Motor)");
    this.setOutput(true, "motor");
    this.setColour(135);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_setup'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Vorbereitung");
    this.appendStatementInput("setup_code")
        .setCheck(null);
    this.appendDummyInput()
        .appendField("Hauptschleife");
    this.appendStatementInput("loop_code")
        .setCheck(null);
    this.setColour(185);
 this.setTooltip("Dieser Block wird für die IoT4School-Module zur Vorbereitung benötigt. Blöcke, die im Bereich Vorbereitung gesetzt werden, werden 1x ausgeführt. Blöcke in der Hauptschleife werden wiederholt ausgeführt");
 //this.setTooltip(MSG['linkTooltip']);
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere RGB_LED");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['rgb_led'], 'rgb_led'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/rgb-led.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("pin")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Pin");
    this.appendValueInput("number")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("LED-Anzahl");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Initialisiere das RGB_LED-Modul mit einer definierten Modul-ID, des verwendeten Pins und der Anzahl der LEDs auf dem Modul");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_set_color'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Definiere RGB-Farbe");
    this.appendValueInput("rgb_led_module_id")
        .setCheck("rgb_led")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("color")
        .setCheck("rgb_led_color")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Farbe");
    this.appendValueInput("led")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) LED-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Definiere eine RGB-Farbe mithilfe einer RGB_LED-Modul-ID und einem Farbblock. Optional: Um die Farbe einer bestimmten LED zu ändern, gib den Index (beginnend bei 0!) für die zu änderende LED an");
 this.setHelpUrl("");
  }
};

// Block von BIPES kopiert und Type Check hinzugef�gt
Blockly.Blocks['iot_rgb_led_color_numbers'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Rot");
    this.appendValueInput("red")
        .setCheck("Number");
    this.appendDummyInput()
        .appendField("Grün");
    this.appendValueInput("green")
        .setCheck("Number");
    this.appendDummyInput()
        .appendField("Blau");
    this.appendValueInput("blue")
        .setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, "rgb_led_color");
    this.setColour(0);
    this.setTooltip("Setze die RGB-Farbe mithilfe von Nummernblöcken im Bereich von 0-255 für jede einzelne Farbe (Rot, Grün und Blau)");
    this.setHelpUrl("");
  },
  styleBlock: function(colours) {
    colours = colours.map(x => parseInt(x))
    colours = colours.includes(NaN) ? [89,102,166] : colours
    if(colours.every((e) => {return e <= 255}) && colours.every((e) => {return e >= 0})) {
      let hex_ = Tool.RGB2HEX (colours [0], colours [1], colours [2]);
      this.setColour(hex_);
    } else
      this.setColour("#FF0000");
  }
};

// Block von BIPES kopiert und Type Check hinzugef�gt
Blockly.Blocks['iot_rgb_led_color_colors'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Farbe")
        .appendField(new Blockly.FieldColour("#ff0000"), "color");
    this.setInputsInline(true);
    this.setOutput(true, "rgb_led_color");
    this.setColour(0);
 this.setTooltip("Setze die RGB-Farbe mithilfe einer Farbpalette");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_set_brightness'] = {
  init: function() {
    // Remove all 'a' characters from the text input's value.
    var validator = function(newValue) {
      return newValue.replace(30, 90);
    };
    this.appendDummyInput()
        .appendField("Definiere RGB-Helligkeit");
    this.appendValueInput("rgb_led_module_id")
        .setCheck("rgb_led")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("brightness")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Helligkeit (in %)");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Definiere die RGB-Helligkeit mithilfe einer RGB_LED-Modul-ID und einem Nummernblock (Wert von 0-100)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_set_enabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte RGB-LED");
    this.appendValueInput("rgb_led_module_id")
        .setCheck("rgb_led")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("an");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Als Eingabe wird eine RGB-LED_Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_set_disabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte RGB-LED");
    this.appendValueInput("rgb_led_module_id")
        .setCheck("rgb_led")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("aus");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Als Eingabe wird eine RGB-LED_Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_rgb_led_toggle'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte RGB-LED");
    this.appendValueInput("rgb_led_module_id")
        .setCheck("rgb_led")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("um");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(0);
 this.setTooltip("Als Eingabe wird eine RGB-LED_Modul-ID erwartet. Schaltet die LED aus/an, je nach aktuellem Zustand");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_smart_button_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere Smart_Button");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['smart_button'], 'smart_button'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/onebutton.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("pin")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Pin");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("Initialisiere das Smart_Button-Modul mit einer definierten Modul-ID und des verwendeten Pins");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_smart_button_set_ticks'] = {
  init: function() {
    this.appendValueInput("smart_button_module_id")
        .setCheck("smart_button")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze Klick-Registrierungsdauer von");
    this.appendValueInput("ticks")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("auf");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("ms");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("Definiere Zeit in ms bevor Klick registriert wird mithilfe einer Smart_Button-Modul-ID und einem Nummernblock (Wert von 1-1000)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_smart_button_set_press_ticks'] = {
  init: function() {
    this.appendValueInput("smart_button_module_id")
        .setCheck("smart_button")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze Drück-Registrierungsdauer von");
    this.appendValueInput("press_ticks")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("auf");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("ms");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("Definiere Zeit in ms bevor langer Klick (Gedrückthalten des Buttons) registriert wird mithilfe einer Smart_Button-Modul-ID und einem Nummernblock (Wert von 1-2000)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_smart_button_reset_total_clicks'] = {
  init: function() {
    this.appendValueInput("smart_button_module_id")
        .setCheck("smart_button")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze den Klick-Zähler von");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("zurück");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(45);
 this.setTooltip("Setzt die Anzahl bisher getätigter Klicks der angegebenen Smart_Button-Modul-ID auf 0 zurück.");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_smart_button_get_total_clicks'] = {
  init: function() {
    this.appendValueInput("smart_button_module_id")
        .setCheck("smart_button")
        .appendField("Lese den Klickzähler von");
    this.setOutput(true, "Number");
    this.setColour(45);
 this.setTooltip("Liest die Anzahl getätigter Klicks eines Smart_Button-Moduls aus und gibt diese als Ganzzahl zurück");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_buzzer_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere Buzzer");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['buzzer'], 'buzzer'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/buzzer.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("pin")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Pin");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
 this.setTooltip("Initialisiere das Buzzer-Modul mit einer definierten Modul-ID und des verwendeten Pins");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_buzzer_set_volume'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Definiere Buzzer-Lautstärke");
    this.appendValueInput("buzzer_module_id")
        .setCheck("buzzer")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("volume")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Lautstärke (in %)");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
 this.setTooltip("Definiere die Buzzer-Lautstärke mithilfe einer Buzzer-Modul-ID und einem Nummernblock (Wert von 0-100)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_buzzer_play_tone'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Spiele Buzzer Ton");
    this.appendValueInput("buzzer_module_id")
        .setCheck("buzzer")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("frequency")
        .setCheck(["Number", "Note"])
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Frequenz / Note");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
 this.setTooltip("Spiele einen Buzzer Ton mithilfe einer Buzzer Modul-ID und einem Nummernblock (Wert von 1-1000) bzw. einem Notenblock");
 this.setHelpUrl("");
  }
};

// Block von BIPES kopiert und Type Check hinzugef�gt
Blockly.Blocks['iot_buzzer_tone_type'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Note:")
        .appendField(new Blockly.FieldDropdown([["B1","31"],["C2","33"],["CS2","35"],["D2","37"],["DS2","39"],["E2","41"],["F2","44"],["FS2","46"],["G2","49"],["GS2","52"],["A2","55"],["AS2","58"],["B2","62"],["C3","65"],["CS3","69"],["D3","73"],["DS3","78"],["E3","82"],["F3","87"],["FS3","93"],["G3","98"],["GS3","104"],["A3","110"],["AS3","117"],["B3","123"],["C4","131"],["CS4","139"],["D4","147"],["DS4","156"],["E4","165"],["F4","175"],["FS4","185"],["G4","196"],["GS4","208"],["A4","220"],["AS4","233"],["B4","247"],["C5","262"],["CS5","277"],["D5","294"],["DS5","311"],["E5","330"],["F5","349"],["FS5","370"],["G5","392"],["GS5","415"],["A5","440"],["AS5","466"],["B5","494"],["C6","523"],["CS6","554"],["D6","587"],["DS6","622"],["E6","659"],["F6","698"],["FS6","740"],["G6","784"],["GS6","831"],["A6","880"],["AS6","932"],["B6","988"]]), "tone");
    this.setOutput(true, "Note");
    this.setColour(330);
 this.setTooltip("");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_buzzer_play_song'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Spiele Musik (RTTTL)");
    this.appendValueInput("buzzer_module_id")
        .setCheck("buzzer")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("rtttl_string")
        .setCheck("String")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("RTTTL-String");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
 this.setTooltip("Spiele Musik (wie zu Nokia-Zeiten) mithilfe einer Modul-ID und einem RTTTL-String. (Rechtsklick auf den Block für weitere Infos zu RTTTL)");
 this.setHelpUrl("https://de.wikipedia.org/wiki/Ring_Tones_Text_Transfer_Language");
  }
};

Blockly.Blocks['iot_buzzer_play_song_from_file'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Spiele Musik (RTTTL) von Datei");
    this.appendValueInput("buzzer_module_id")
        .setCheck("buzzer")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("rtttl_songname")
        .setCheck("String")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Name des Klingeltons");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(330);
 this.setTooltip("Spielt Songs vom Mikrocontroller aus der Datei 'songs.py'. Angabe des Klingelton-Namens. (Rechtsklick auf den Block für weitere Infos zu RTTTL)");
 this.setHelpUrl("https://de.wikipedia.org/wiki/Ring_Tones_Text_Transfer_Language");
  }
};

Blockly.Blocks['iot_dht_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere DHT")
        .appendField(new Blockly.FieldDropdown([["11","dht11"], ["22","dht22"]]), "type");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['dht'], 'dht'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/dht11.png", 80, 80, { alt: "*", flipRtl: "FALSE" }), 'IMAGE');
    this.appendValueInput("pin")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Pin");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Initialisiere das DHT-Modul mit einer definierten Modul-ID und des verwendeten Pins");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_sht_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere SHT");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['sht'], 'sht'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/sht.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("i2c")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("I2C");
    this.appendValueInput("scl")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("SCL");
    this.appendValueInput("sda")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("SDA");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Initialisiere das SHT-Modul mit einer definierten Modul-ID und der verwendeten I2C-Adresse (HEX-Wert wird automatisch zu Dezimal umgewandelt)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_dsht_set_enabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte DHT/SHT");
    this.appendValueInput("dsht_module_id")
        .setCheck(["dht", "sht"])
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .appendField("an");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Als Eingabe wird eine DHT- oder SHT-Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_dsht_set_disabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte DHT/SHT");
    this.appendValueInput("dsht_module_id")
        .setCheck(["dht", "sht"])
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .appendField("aus");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Als Eingabe wird eine DHT- oder SHT-Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_dsht_set_debounce_time'] = {
  init: function() {
    this.appendValueInput("dsht_module_id")
        .setCheck(["dht", "sht"])
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze Dauer zwischen zwei Messungen von");
    this.appendValueInput("debounce")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("auf");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("s");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(210);
 this.setTooltip("Definiere Mindestdauer in Sekunden, bevor erneut eine Messung durchgeführt wird mithilfe einer DHT- oder SHT-Modul-ID und einem Nummernblock (Wert von 1-3600)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_dsht_get_temperature'] = {
  init: function() {
    this.appendValueInput("dsht_module_id")
        .setCheck(["dht", "sht"])
        .appendField("Lese Temperatur von");
    this.setOutput(true, "Number");
    this.setColour(210);
 this.setTooltip("Gibt die zuletzt gemessene Temperatur von einem SHT oder DHT-Sensor als Ganzzahl zurück");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_dsht_get_humidity'] = {
  init: function() {
    this.appendValueInput("dsht_module_id")
        .setCheck(["dht", "sht"])
        .appendField("Lese Feuchtigkeits-Wert von");
    this.setOutput(true, "Number");
    this.setColour(210);
 this.setTooltip("Gibt den zuletzt gemessenen Feuchtigkeitswert von einem SHT oder DHT-Sensor als Ganzzahl zurück");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere PIR");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['pir'], 'pir'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/pir.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("pin")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Pin");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(255);
 this.setTooltip("Initialisiere das PIR-Modul mit einer definierten Modul-ID und des verwendeten Pins");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_set_enabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte PIR");
    this.appendValueInput("pir_module_id")
        .setCheck("pir")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .appendField("an");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(255);
 this.setTooltip("Als Eingabe wird eine PIR-Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_set_disabled'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Schalte PIR");
    this.appendValueInput("pir_module_id")
        .setCheck("pir")
        .setAlign(Blockly.ALIGN_RIGHT);
    this.appendDummyInput()
        .appendField("aus");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(255);
 this.setTooltip("Als Eingabe wird eine PIR-Modul-ID erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_set_debounce_time'] = {
  init: function() {
    this.appendValueInput("pir_module_id")
        .setCheck("pir")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze \"Bewegungserkennungs-Rate\" von");
    this.appendValueInput("debounce")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("auf");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("s");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(255);
 this.setTooltip("Definiere die \"Bewegungserkennungs-Rate\" (Zeit, die nach einer Bewegungserkennung verstreichen muss, bis erneut eine Bewegung erkannt werden kann) in Sekunden mithilfe einer PIR-Modul-ID und einem Nummernblock (Wert von 1-3600)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_reset_total_alarms'] = {
  init: function() {
    this.appendValueInput("pir_module_id")
        .setCheck("pir")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Setze den Alarmcounter von");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("zurück");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(255);
 this.setTooltip("Setzt den Counter für die Anzahl ausgelöster Alarme der angegebenen PIR-Modul-ID auf 0 zurück.");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_pir_get_total_alarms'] = {
  init: function() {
    this.appendValueInput("pir_module_id")
        .setCheck("pir")
        .appendField("Lese den Alarmzähler von");
    this.setOutput(true, "Number");
    this.setColour(255);
 this.setTooltip("Liest die Anzahl ausgelöster Alarme eines PIR-Sensors aus und gibt diese als Ganzzahl zurück");
 this.setHelpUrl("");
  }
};

// Custom Callback IoT MQTT
Blockly.Blocks['iot_mqtt_set_callback'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Setze Callback für Nachrichten der Form");
    this.appendDummyInput()
        .appendField("(")
        .appendField(new Blockly.FieldVariable("topic", null, ["topic"], "topic"), "topic")
        .appendField(",")
        .appendField(new Blockly.FieldVariable("msg"), "msg")
        .appendField(",")
        .appendField(new Blockly.FieldLabelSerializable("retain"), "retain")
        .appendField(",")
        .appendField(new Blockly.FieldLabelSerializable("duplicate"), "duplicate")
        .appendField(")");
    this.appendDummyInput()
        .appendField("und führe bei Nachrichteneingang");
    this.appendStatementInput("do")
        .setCheck(null)
        .appendField("Folgendes aus:");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("black");
 this.setTooltip("Durch diese Funktion können eigene Aktionen festgelegt werden, wenn das Gerät eine Nachricht auf ein abonniertes Thema erhält");
 this.setHelpUrl("");
  }
};

// Custom Subscribe IoT MQTT
Blockly.Blocks['iot_mqtt_subscribe'] = {
  init: function() {
    this.appendValueInput("topic")
        .setCheck("String")
        .appendField("Abonniere folgendes MQTT Thema:");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("black");
 this.setTooltip("Hier kann ein eigenes Abonnement (Subscription) zu einem beliebigen Thema (Topic) festgelegt werden. (Angabe des Themas als String)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_mqtt_publish'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Sende MQTT-Nachricht");
    this.appendValueInput("topic")
        .setCheck("String")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Thema");
    this.appendValueInput("msg")
        .setCheck("String")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Nachrichten-Inhalt");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("QoS")
        .appendField(new Blockly.FieldDropdown([["0 - höchstens 1x","0 "], ["1 - mindestens 1x","1"], ["option","OPTIONNAME"]]), "qos_lvl");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("black");
 this.setTooltip("Dieser Block sendet die definierte Nachricht (Payload) an das definierte Thema (Topic) unter Angabe einer Dienstgüte (Quality of Service). Als Eingabe wird jeweils ein String erwartet");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_init'] = {
  init: function() {
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("Initialisiere Motor");
    this.appendDummyInput()
        .setAlign(Blockly.ALIGN_CENTRE)
        .appendField("mit Modul-ID")
        .appendField(new Blockly.FieldVariable("", null, ['motor'], 'motor'), 'NAME');
    this.appendDummyInput()
        .appendField(new Blockly.FieldImage("/iot_img/motor.png", 80, 80, { alt: "*", flipRtl: "FALSE" }));
    this.appendValueInput("i2c")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("I2C");
    this.appendValueInput("scl")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("SCL");
    this.appendValueInput("sda")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("SDA");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Initialisiere das Motor-Modul mit einer definierten Modul-ID und der verwendeten I2C-Adresse (HEX-Wert wird automatisch zu Dezimal umgewandelt)");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_set_enabled'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Schalte Motor an");
    this.appendValueInput("motor_module_id")
        .setCheck("motor")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("motor_index")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) Motor-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Als Eingabe wird eine Motor-Modul-ID und optional ein Motor-Index (0 = 1. Motor; 1 = 2. Motor) erwartet. Wurde kein Motor-Index angegeben, werden beide Motoren angesprochen.");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_set_disabled'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Schalte Motor aus");
    this.appendValueInput("motor_module_id")
        .setCheck("motor")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("motor_index")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) Motor-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Als Eingabe wird eine Motor-Modul-ID und optional ein Motor-Index (0 = 1. Motor; 1 = 2. Motor) erwartet. Wurde kein Motor-Index angegeben, werden beide Motoren angesprochen.");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_toggle'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Schalte Motor um");
    this.appendValueInput("motor_module_id")
        .setCheck("motor")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("motor_index")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) Motor-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Als Eingabe wird eine Motor-Modul-ID und optional ein Motor-Index (0 = 1. Motor; 1 = 2. Motor) erwartet. Wurde kein Motor-Index angegeben, werden beide Motoren angesprochen.");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_set_speed'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Setze Motor-Geschwindigkeit");
    this.appendValueInput("motor_module_id")
        .setCheck("motor")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("speed")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Geschwindigkeit (in %)");
    this.appendValueInput("motor_index")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) Motor-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Definiere die Motorgeschwindigkeit mithilfe einer Motor-Modul-ID und einem Nummernblock im Wertebereich von -100 (rückwärts) bis 100 (vorwärts). Optional: Angabe eines Motor-Index (0 = 1. Motor; 1 = 2. Motor). Wurde kein Motor-Index angegeben, werden beide Motoren angesprochen");
 this.setHelpUrl("");
  }
};

Blockly.Blocks['iot_motor_brake'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Halte Motor an");
    this.appendValueInput("motor_module_id")
        .setCheck("motor")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("Modul-ID");
    this.appendValueInput("motor_index")
        .setCheck("Number")
        .setAlign(Blockly.ALIGN_RIGHT)
        .appendField("(Optional) Motor-Index");
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(135);
 this.setTooltip("Der Motor wird aktiv gebremst, anstatt langsam auszurollen. Als Eingabe wird eine Motor-Modul-ID und optional ein Motor-Index (0 = 1. Motor; 1 = 2. Motor) erwartet. Wurde kein Motor-Index angegeben, werden beide Motoren angesprochen.");
 this.setHelpUrl("");
  }
};
