<?php
	try{
		// baue Verbindung zur sql DB auf
		$mqtt_db = new PDO('sqlite:/var/www/db/mqttClient.db');
		// setze fehlermodus zu exceptions
    	$mqtt_db->setAttribute(PDO::ATTR_ERRMODE, 
                            PDO::ERRMODE_EXCEPTION);
		// hole alle DB Einträge
		$result = $mqtt_db->query('SELECT * FROM espClients ORDER BY length(id), id ASC');

 		$rows = null;
		//DB Einträge auflisten
    	foreach($result as $row) {
			$rows .= "<tr>";
    		$rows .= "<td class='id'>{$row['id']}</td>";
    		$rows .= "<td>{$row['ip']}</td>";
    		$rows .= "<td class='mac'>{$row['mac']}</td>";
    		$rows .= "<td class='status'>{$row['status']}</td>";
                $rows .= "<td><button type='button' class='blink-button'/>Blink!</td>";
    		$rows .= "</tr>\n";
		}
		//HTML Tabellen Header
		echo <<<EOD
			<table>
				<tr>
    				<th>Geräte-ID</th>
    				<th>IP-Adresse</th>
    				<th>MAC-Adresse</th>
    				<th>Verbindungsstatus Broker</th>
				<th>Aktion</th>
				</tr>
				$rows
			</table>
EOD;
		//Trenne Verbidung zur DB
		$mqtt_db = null;
	}
  catch(PDOException $e) {
    // Gebe exeptionmeldung aus
    echo $e->getMessage();
  }
?>




