# IoT4School 2.0
Eine exemplarische Internet of Things Infrastruktur für den Einsatz im Informatikunterricht.

Die größten Änderungen zur Version 1.0:
- Verwendung von Micropython (basierend auf Python 3.4) anstatt Arduino (C++)
- Verwendung eines modularen Stecksystems auf Basis des Evaluationsboards Wemos D1 (ESP8266)
- Blockbasierte Einrichtung und Programmierung der Module mittels BIPES

Hardwarevoraussetzungen:
- Raspberry Pi 3b mit einer mindestens 16GB großen microSD Karte (Raspberry Pi OS: Buster)
  - Möglicherweise auch kompatibel zum Raspberry Pi 4, jedoch nicht getestet
- Ein WLAN-Router zum Empfangen und Versenden von Netzwerkpaketen
- [Wemos D1 mini][1] Mikrocontroller sowie (Wemos-kompatible) [Shields][2]

Um das Projekt IoT4School 2.0 nutzen zu können, müssen folgende Anleitungen nach Reihenfolge durchgeführt werden:  
- [Raspberry Einrichtung mit Image [Für Einsteigende]][3] **ODER** [Raspberry Einrichtung ohne Image [Für erfahrene Anwendende]][4]
- [Wemos D1 Mini Ersteinrichtung und Konfiguration][5]
- [Einführung in das blockbasierte Programmieren mit BIPES und Node-RED][6]

Zusätzlich werden den Entwickelnden zur Erweiterung der IoT4School-Infrastruktur folgende Anleitungen zur Verfügung gestellt:
- [Blöcke für IoT4School entwickeln und einbinden][7]
- [Anpassungen an der Micropython-Firmware vornehmen][8]

Weitere Informationen zum Projekt sind im [Wiki](https://github.com/esdkrwl/IoT4School/wiki) zu finden.

[1]: https://www.wemos.cc/en/latest/d1/d1_mini.html
[2]: https://www.wemos.cc/en/latest/d1_mini_shield/index.html
[3]: https://github.com/esdkrwl/IoT4School/wiki/Raspberry-Pi-Einrichtung-mit-Image
[4]: https://github.com/esdkrwl/IoT4School/wiki/Raspberry-Pi-Einrichtung-ohne-Image
[5]: https://github.com/esdkrwl/IoT4School/wiki/Wemos-D1-mini-(ESP8266)-Einrichtung
[6]: https://github.com/esdkrwl/IoT4School/wiki/Einf%C3%BChrung-in-das-blockbasierte-Programmieren-mit-BIPES-und-Node-RED
[7]: https://github.com/esdkrwl/IoT4School/wiki/Erstelle-IoT4School-2.0-Bl%C3%B6cke
[8]: https://github.com/esdkrwl/IoT4School/wiki/Erzeugen-einer-eigenen-MicroPython-Firmware
