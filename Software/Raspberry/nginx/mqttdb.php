<?php

		$file_db = new PDO('sqlite:/var/www/db/mqttClient.db');
    	// Set errormode to exceptions
    	$file_db->setAttribute(PDO::ATTR_ERRMODE, 
                            PDO::ERRMODE_EXCEPTION);

		    // Select all data from memory db messages table 
    	$result = $file_db->query('SELECT * FROM espClients');

		//echo '
        //	<tr>
        //    	<td>'.'Status'.'</td>
        //    	<td>'.'MAC'.'</td>
		//		<td>'.'IP'.'</td>
        //    	<td>'.'Typ'.'</td>
		//		<td>'.'Name'.'</td>

        //	</tr> 
    	//	';
		//echo('<br />');
		//echo('<br />');
 
    	foreach($result as $row) {
			echo '
        		<tr>
            		<td>'.$row["status"].'</td>
            		<td>'.$row['mac'].'</td>
            		<td>'.$row['IP'].'</td>
          
            		<td>'.$row['type'].'</td>
            		<td>'.$row['name'].'</td>
        		</tr> 
    		';
			echo('<br />');
			echo('<br />');
		}
?>


