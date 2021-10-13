
const createFlyout = function(workspace) {
    // Diese Funktion aktualisiert das Flyout "IoT Modul-IDs" mit allen bisher verwendeten Variablen speziell definierter Modultypen
    // Aktuell speziell definierte Modultypen sind: "rgb_led", "smart_button", "buzzer", "dht", "sht", "pir" und "motor"
    let variableModelList = workspace.getAllVariables();
    //console.log(Blockly.VariablesDynamic.flyoutCategoryBlocks(workspace))
    let xmlList = []; 
    if (variableModelList.length > 0) {
      variableModelList.sort(Blockly.VariableModel.compareByType);
        for (var i = 0, variable; (variable = variableModelList[i]); i++) {
          console.log(variableModelList[i].type)
          switch(variableModelList[i].type)
          {
            case 'rgb_led':
              var blockText = '<block type="iot_rgb_led_get_module_id"><field name="NAME" variabletype="rgb_led">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'smart_button':
              var blockText = '<block type="iot_smart_button_get_module_id"><field name="NAME" variabletype="smart_button">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'buzzer':
              var blockText = '<block type="iot_buzzer_get_module_id"><field name="NAME" variabletype="buzzer">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'dht':
              var blockText = '<block type="iot_dht_get_module_id"><field name="NAME" variabletype="dht">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'sht':
              var blockText = '<block type="iot_sht_get_module_id"><field name="NAME" variabletype="sht">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'pir':
              var blockText = '<block type="iot_pir_get_module_id"><field name="NAME" variabletype="pir">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
            case 'motor':
              var blockText = '<block type="iot_motor_get_module_id"><field name="NAME" variabletype="motor">';
              blockText += variableModelList[i].name;
              blockText += '</field></block>';
              var block = Blockly.Xml.textToDom(blockText);
              xmlList.push(block);
              break;
          }
        }
    }
    return xmlList;
};
