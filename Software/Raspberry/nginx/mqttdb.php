<?php
	try{
		// baue Verbindung zur sql DB auf
		$mqtt_db = new PDO('sqlite:/var/www/db/mqttClient.db');
		// setze fehlermodus zu exceptions
    	$mqtt_db->setAttribute(PDO::ATTR_ERRMODE, 
                            PDO::ERRMODE_EXCEPTION);
		// hole alle DB Einträge
		$result = $mqtt_db->query('SELECT * FROM espClients');

 		$rows = null;
		//DB Einträge auflisten
    	foreach($result as $row) {
			$rows .= "<tr>";
    		$rows .= "<td>{$row['status']}</td>";
    		$rows .= "<td>{$row['mac']}</td>";
    		$rows .= "<td>{$row['IP']}</td>";
    		$rows .= "<td>{$row['type']}</td>";
    		$rows .= "<td>{$row['name']}</td>";
    		$rows .= "</tr>\n";
		}
		//HTML Tabellen Header
		echo <<<EOD
			<table>
				<tr>
    				<th>Status</th>
    				<th>Mac</th>
    				<th>IP</th>
    				<th>Typ</th>
    				<th>Name</th>
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




