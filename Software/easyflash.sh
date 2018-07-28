#!/bin/bash
echo ""
echo "Flashtool, welches nicht geil ist, aber seinen Job macht v1.0"
echo ""
echo "[1] Sensor"
echo "[2] Aktor"
read modul

if [ $modul = 1 ]
  then
    echo "Sensor gewählt"
  	echo ""
    echo "Welcher Sensor soll geflasht werden?"
  	echo ""
    echo "[1] Barometer"
    echo "[2] Bodensensor"
    echo "[3] KlatschSensor"
    echo "[4] Magnetschalter"
    echo "[5] Bewegungssensor"
    echo "[6] Smart-Button"
    echo "[7] Regensensor"
    echo "[8] Wetterstation"
    read sensor
  	echo ""
    if [ $sensor = 1 ]
      then
        echo "Flashe Sensor Barometer"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/Barometer/Barometer2018.bin
    elif [ $sensor = 2 ]
      then
  		    echo "Flashe Sensor Bodensensor"
          esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/BodenSensor/Boden2018.bin
    elif [ $sensor = 3 ]
      then
  		  echo "Flashe Sensor KlatschSensor"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/Clap-Sensor/Klatsch2018.bin
    elif [ $sensor = 4 ]
      then
  		  echo "Flashe Sensor Magnetschalter"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/MagnetSchalter/Magnetschalter2018.bin
    elif [ $sensor = 5 ]
      then
  		  echo "Flashe Sensor Bewegungssensor"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/PIR/PIR2018.bin
    elif [ $sensor = 6 ]
      then
  		  echo "Flashe Sensor Smart-Button"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/Smart_Button/Smart-Button2018.bin
    elif [ $sensor = 7 ]
      then
  		  echo "Flashe Sensor Regensensor"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/Regen/Regen2018.bin
    elif [ $sensor = 8 ]
      then
  		  echo "Flashe Sensor Wetterstation"
        esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Sensor/Wetterstation/Wetterstation.ino.generic.bin
    else
  		echo "Shitty Eingabe.. Beende.."
  	fi

elif [ $modul = 2 ]
    then
      echo "Aktor gewählt"
    	echo ""
      echo "Welcher Aktor soll geflasht werden?"
    	echo ""
      echo "[1] Piezo"
      echo "[2] RGB-LED"
      echo "[3] Servomotor"
      echo "[4] Steckdose"
      read aktor
    	echo ""
      if [ $aktor = 1 ]
        then
          echo "Flashe Aktor Piezo"
          esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Aktor/Piezo/Piezo2018.bin
      elif [ $aktor = 2 ]
        then
    		    echo "Flashe Aktor RGB-LED"
            esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Aktor/RGB_LED_CONTROLLER/RGB2018.bin
      elif [ $aktor = 3 ]
        then
    		  echo "Flashe Aktor Servomotor"
          esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Aktor/Servo/Servo2018.bin
      elif [ $aktor = 4 ]
        then
      	  echo "Flashe Aktor Steckdose"
          esptool.py --chip esp8266 --port /dev/ttyUSB0 write_flash 0x000000 /home/a/IoT4School/Software/ESP-Clients/Aktor/Steckdose/Steckdose2018.bin
      else
        echo "Shitty Eingabe.. Beende.."
      fi
  else
    echo "Shitty Eingabe.. Beende.."
fi
