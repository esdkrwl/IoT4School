import ujson

# Funktion, um das JSON Objekt aus der device_config auszulesen und zu einem Python Dict Objekt zu konvertieren
# Return-Wert: Dict-Objekt. Beim Fehler False.
def read():
    try:
        with open('/device_config.json', 'r') as file:
            config = ujson.load(file)
            return config
    except OSError: #wenn Datei nicht gefunden wurde
        print('[ERROR] Datei wurde nicht gefunden')
        return False
    except ValueError: #Syntaxfehler in der JSON
        print('[ERROR] Fehlerhafte JSON. JSON lässt sich nicht auslesen.')
        return False

# Funktion, um den Wert eines übergebenen Schlüssels aus einem übergebenen Dict-Objekt auszulesen
# Parameter: Dict-Objekt, Name des ersten Schlüssels, Optional: Name des zweiten Schlüssels (Bei verschachtelten Einträgen)
# Return-Wert: Wert des Schlüssels. Beim Fehler False.
def read_key(config, key_name1, key_name2 = None):
    if key_name1 in config:
        if key_name2 == None:
            key_value = config[key_name1]
            if key_name1 == 'webrepl_password':
                if len(key_value) > 9:
                    print('[ERROR] Passwort für WebREPL zu lang. Kürze auf 9 Zeichen...')
                    key_value = key_value[:9]
            elif key_name1 == 'ap_mode_password':
                if len(key_value) < 8 or len(key_value) > 64:
                    print('[ERROR] Passwort für AP-Modus ist {} Zeichen lang. Länge muss zwischen 8-64 Zeichen liegen'.format(len(key_value)))
                    return False
            print('[INFO] Wert von {} lautet: {}'.format(key_name1, key_value))
        else:
            if key_name2 in config[key_name1]:
                key_value = config[key_name1][key_name2]
                print('[INFO] Wert von {}|{} lautet: {}'.format(key_name1, key_name2, key_value))
            else:
                print('[ERROR] Kein Wert für {}|{} gefunden.'.format(key_name1, key_name2))
                return False
        return key_value
    else:
        print('[ERROR] Kein Wert für {} gefunden.'.format(key_name1))
        return False

# Funktion, um einen neuen Wert eines übergebenen Schlüssels in die device_config zu schreiben
# Parameter: Neuer Wert, Name des ersten Schlüssels, Optional: Name des zweiten Schlüssels (Bei verschachtelten Einträgen)
def write_key(key_value, key_name1, key_name2 = None):
    try:
        config = read()
        if key_name1 in config:
            if key_name2 == None:
                config[key_name1] = key_value
                with open('/device_config.json', 'w') as file:
                    ujson.dump(config, file)
            else:
                if key_name2 in config[key_name1]:
                    config[key_name1][key_name2] = key_value
                    with open('/device_config.json', 'w') as file:
                        ujson.dump(config, file)
    except ValueError:
        print('[ERROR] Fehler beim Schreiben des neuen Wertes. Es wurden keine Änderungen vorgenommen.')
        with open('/device_config.json', 'w') as file:
          ujson.dump(config, file)
