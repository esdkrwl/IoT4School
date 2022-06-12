#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os.path
from os import path
import sys
import codecs

CLONE_PATH = "/var/www/html/BIPES"
PATH = "/var/www/html/BIPES/ui/core/"
PATH_TOOLBOX = "/var/www/html/BIPES/ui/toolbox/"
CLONE = "git clone https://github.com/BIPES/BIPES.git /var/www/html/BIPES"
CLONE_FREEBOARD = "git clone https://github.com/BIPES/freeboard.git /var/www/html/BIPES/ui/freeboard"
# Dieses Skript patcht die vorhandenen BIPES-Dateien mit den IOT-Blöcken sowie der dazugehörigen Logik
# Wenn BIPES nicht vorhanden ist, wird es heruntergeladen. Wenn es vorhanden ist, wird es nur gepatcht

if path.exists(CLONE_PATH) == False:
    try:
        os.system(CLONE)
        os.system(CLONE_FREEBOARD)
    except:
        print('Fehler beim Downloaden von BIPES. Programm wird beendet..')
        sys.exit()
    if os.path.exists(CLONE_PATH) == False:
        sys.exit()
    else:
        working_dir = os.getcwd()
        os.chdir(CLONE_PATH)
        os.system("make submodules")
        os.system("make git-clone")
        os.chdir(working_dir)

# Datei einlesen, zwischenspeichern, updaten und neu beschreiben (Ersetzen bestimmter Code-Zeilen)
i = 0 # Prüfziffer, wie oft etwas in code.js ersetzt wurde
j = 0 # Prüfziffer, wie oft etwas in utils.js ersetzt wurde
try:
    print('[INFO] Patche code.js (Inplace) an zwei Stellen.. ', end = '')
    with codecs.open(PATH + 'code.js', 'r', encoding= 'latin-1') as code_in:
        buf = code_in.readlines()
    with codecs.open(PATH + 'code.js', 'w', encoding= 'latin-1') as code_out:
        for index,line in enumerate(buf):
            if line.find('oneBasedIndex: false,') != -1:
                if buf[index+1].find('maxInstances: {\'iot_setup\': 1},') == -1:
                    i += 1
                    line = line + '       maxInstances: {\'iot_setup\': 1},\n'
                else:
                    print(' maxInstances in code.js bereits gepatcht!', end = '')
            if line.find('Code.loadBlocks(\'\');') != -1:
                if buf[index-1].find('Code.workspace.registerToolboxCategoryCallback') == -1:
                    i += 1
                    line = '  Code.workspace.registerToolboxCategoryCallback(\'CREATE_TYPED_MODULE_ID\', createFlyout);\n' + line 
                else:
                    print(' Code.workspace.registerToolboxCategoryCallback in code.js bereits gepatcht!', end = '')
            code_out.write(line)
    print(' Es wurden {} von 2 Stellen in der code.js gepatcht!'.format(i))
except Exception as e:
    print(' Es ist etwas beim Patchen (Inplace) der code.js schiefgelaufen:', e)

try:
    print('[INFO] Patche utils.js (Inplace) an zwei Stellen.. ', end = '')
    with codecs.open(PATH + 'utils.js', 'r', encoding= 'latin-1') as code_in:
        buf = code_in.readlines()
    with codecs.open(PATH + 'utils.js', 'w', encoding= 'latin-1') as code_out:
        for index,line in enumerate(buf):
            if line.find('return desc ? `${desc [1].replaceAll') != -1:
                j += 1
                line = '      return desc ? `main.${ext}` : imp.length ? `my_${imp.slice(-1)[0][1]}_project.bipes.${ext}` : `my_project.bipes.${ext}`;\n'
            else:
                if line.find('return desc ? `main.${ext}`') != -1:
                    print(' main.py-Benennung in utils.js bereits gepatcht!', end = '')
            if line.find('<value name="project_description"><shadow type="text" id=""><field name="TEXT">My project</field></shadow></value></block></xml>') != -1:
                j += 1
                line = '    return `<xml xmlns="https://bipes.net.br"><workspace><databoard><![CDATA[{"currentWorkspace":"kvflqzky5js84d7x5pe","workspace:kvflqzky5js84d7x5pe":[]}]]></databoard></workspace><block type="project_metadata" id="" x="200" y="0"><value name="project_author"><shadow type="text" id=""><field name="TEXT">${account_user}</field></shadow></value><value name="project_iot_id"><shadow type="math_number" id=""><field name="NUM">0</field></shadow></value><value name="project_description"><shadow type="text" id=""><field name="TEXT">My project</field></shadow></value></block><block type="iot_setup" id="" x="-300" y="0"></block></xml>`\n'
            else:
                if line.find('<block type="iot_setup" id="" x="-300" y="0"></block>') != -1:
                    print(' iot_setup-Startblock in utils.js bereits gepatcht!', end = '')
            code_out.write(line)
    print(' Es wurden {} von 2 Stellen in der utils.js gepatcht!'.format(j))
except Exception as e:
    print(' Es ist etwas beim Patchen (Inplace) der utils.js schiefgelaufen:', e)

try:
    print('[INFO] Patche esp8266.xml (Inplace).. ', end = '')
    with codecs.open(PATH_TOOLBOX + 'esp8266.xml', 'r', encoding= 'latin-1') as esp8266_in:
        buf = esp8266_in.readlines()
    with codecs.open(PATH_TOOLBOX + 'esp8266.xml', 'r+', encoding= 'latin-1') as esp8266_out, open('esp8266_cs.xml', 'r', encoding= 'latin-1') as esp8266_cs:
        for index,line in enumerate(buf):
            if line.find('<category name="IoT4School" colour="185">') != -1:
               print('esp8266.xml (Inplace) schon gepatcht..')
               break
        else:
            for index,line in enumerate(buf):
                if line.find('<category name="Machine" colour="%{BKY_VARIABLES_HUE}">') != -1:
                    if buf[index+1].find('-->') != -1:
                        print('esp8266.xml wurde gepatcht!')
                        buf[index+1] = buf[index+1] + esp8266_cs.read()
                        #line = buf[index+1] + esp8266_cs.read()
                esp8266_out.write(line)
except Exception as e:
    print('Es ist etwas beim Patchen (Inplace) der esp8266.xml schiefgelaufen:', e)
        

# Hier folgen nur noch die Operationen, bei denen etwas am Ende der Datei hinzugefügt werden muss
with codecs.open(PATH + 'block_definitions.js', 'r+', encoding= 'latin-1') as block_definitions, open('block_definitions_cs.js', 'r', encoding= 'latin-1') as block_definitions_cs:
    try:
        print('[INFO] Patche block_definitions.js (Append).. ', end = '')
        for line in block_definitions:
            if line.find('IOT4SCHOOL-BLOCKDEFINITIONEN') != -1:
                print('block_definitions.js (Append) schon gepatcht..')
                break
        else:       
            print('block_definitions.js wurde gepatcht!')
            block_definitions.write(block_definitions_cs.read())         
    except Exception as e:
        print('Es ist etwas beim Patchen (Append) der block_definitions.js schiefgelaufen:', e)
        
with codecs.open(PATH + 'generator_stubs.js', 'r+', encoding= 'latin-1') as generator_stubs, open('generator_stubs_cs.js', 'r', encoding= 'latin-1') as generator_stubs_cs:
    try:
        print('[INFO] Patche generator_stubs.js (Append).. ', end = '')
        for line in generator_stubs:
            if line.find('IOT4SCHOOL-BLOCKCODE') != -1:
                print('generator_stubs.js (Append) schon gepatcht..')
                break      
        else:
            print('generator_stubs.js wurde gepatcht!')
            generator_stubs.write(generator_stubs_cs.read())
    except Exception as e:
        print('Es ist etwas beim Patchen (Append) der generator_stubs.js schiefgelaufen:', e)
       
with codecs.open(PATH + 'code.js', 'r+', encoding= 'latin-1') as code, open('code_cs.js', 'r', encoding= 'latin-1') as code_cs:
    try:
        print('[INFO] Patche code.js (Append).. ', end = '')
        for line in code:
            if line.find('const createFlyout = function(workspace)') != -1:
                print('code.js (Append) schon gepatcht..')
                break      
        else:
            print('code.js wurde gepatcht!')
            code.write(code_cs.read())
    except Exception as e:
        print('Es ist etwas beim Patchen (Append) der code.js schiefgelaufen:', e)

print('[INFO] Patchvorgang beendet.')