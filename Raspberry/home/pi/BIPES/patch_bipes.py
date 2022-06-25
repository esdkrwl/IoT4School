# Dieses Skript patcht die vorhandenen BIPES-Dateien mit den IOT-Blöcken sowie der dazugehörigen Logik
# Wenn BIPES nicht vorhanden ist, wird es heruntergeladen. Wenn es vorhanden ist, kann eine Aktualisierung durch Ablöschen der vorhandenen Dateien erzwungen werden.

#!/usr/bin/python3
# -*- coding: utf-8 -*-
import os.path
from os import path
import sys
import codecs
import shutil
import platform
import subprocess

# Umgebungsvariablen
CLONE_PATH = "/var/www/html/BIPES"
PATH = "/var/www/html/BIPES/ui/core/"
PATH_TOOLBOX = "/var/www/html/BIPES/ui/toolbox/"
CLONE = "git clone https://github.com/casjengu/BIPES.git /var/www/html/BIPES"
CLONE_FREEBOARD = "git clone https://github.com/BIPES/freeboard.git /var/www/html/BIPES/ui/freeboard"
CLONE_DATABOARD = "git clone https://github.com/BIPES/Databoard.git /var/www/html/BIPES/databoard"

# Interne Funktion, die mittels Ping an den Google Public DNS prüft, ob eine Internetverbindung vorhanden ist
def __check_internet_connection():
    #Returns True if 8.8.8.8 responds to a ping request.

    # Option for the number of packets as a function of
    param = '-n' if platform.system().lower()=='windows' else '-c'

    # Building the command. Ex: "ping -c 1 google.com"
    
    command = ['ping', param, '1', '8.8.8.8']
    return subprocess.run(args=command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL).returncode == 0

# Funktion, mit der abgefragt wird, ob BIPES aktualisiert werden soll
def query_yes_no(question, default="yes"):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
            It must be "yes" (the default), "no" or None (meaning
            an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {"yes": True, "y": True, "ye": True, "no": False, "n": False}
    if default is None:
        prompt = " [y/n] "
    elif default == "yes":
        prompt = " [Y/n] "
    elif default == "no":
        prompt = " [y/N] "
    else:
        raise ValueError("invalid default answer: '%s'" % default)

    while True:
        sys.stdout.write(question + prompt)
        choice = input().lower()
        if default is not None and choice == "":
            return valid[default]
        elif choice in valid:
            return valid[choice]
        else:
            sys.stdout.write("Please respond with 'yes' or 'no' " "(or 'y' or 'n').\n")

# Funktion, die BIPES und die Abhängigkeiten aus dem Github-Repo lädt
def load_bipes():
    if not __check_internet_connection():
        print('[ERROR] Fehler: Es wurde keine aktive Internetverbindung erkannt. Daten können nicht heruntergeladen werden. Programm wird beendet..')
        sys.exit()
    else:
        try:
            os.system(CLONE)
            os.system(CLONE_FREEBOARD)
            os.system(CLONE_DATABOARD)
        except:
            print('[ERROR] Fehler beim Downloaden von BIPES. Programm wird beendet..')
            sys.exit()
        if os.path.exists(CLONE_PATH) == False:
            sys.exit()
        else:
            working_dir = os.getcwd()
            os.chdir(CLONE_PATH)
            os.system("make git-clone")
            print('[INFO] Patchvorgang beendet.')


# Hier beginnt das eigentliche Programm
if path.exists(CLONE_PATH) == False:
    load_bipes()
else:
    print('[INFO] Ordner "BIPES" gefunden.')
    answer = query_yes_no("Soll BIPES aktualisiert werden? (ACHTUNG: Hierfür wird der bestehende Ordner gelöscht und neu heruntergeladen)", "no")
    if answer == True:
        print('[INFO] Aktualisiere BIPES...')
        shutil.rmtree(CLONE_PATH, ignore_errors=True)
        if path.exists(CLONE_PATH) == False:
            load_bipes()
        else:
            print('[ERROR] Fehler: Der Ordner konnte nicht abgelöscht werden. (Fehlende Berechtigung?) Programm wird beendet..')
            sys.exit()
    else:
        print('[INFO] Patchvorgang abgebrochen.')