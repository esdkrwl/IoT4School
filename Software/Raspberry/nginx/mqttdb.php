

<?php
		$file_db = new PDO('sqlite:/var/www/db/mqttClient.db');

    	$result = $file_db->query('SELECT * FROM espClients');

 		$rows = null;
    	foreach($result as $row) {
			$rows .= "<tr>";
    		$rows .= "<td>{$row['status']}</td>";
    		$rows .= "<td>{$row['mac']}</td>";
    		$rows .= "<td>{$row['IP']}</td>";
    		$rows .= "<td>{$row['type']}</td>";
    		$rows .= "<td>{$row['name']}</td>";
    		$rows .= "</tr>\n";
		}

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
?>




