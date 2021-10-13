<!DOCTYPE HTML>
<html>
  <head>
    <Meta charset="UTF-8">
    <title>IoT4School</title>
    <link rel="stylesheet" type="text/css" href="css/style.css">
    <link rel="shortcut icon" href="icons/favicon.ico" type="image/x-icon"/>
    <script src="js/jquery-3.6.0.min.js"></script>
    <script src="js/mqttws31.min.js" type="text/javascript"></script>
    <script src="js/mqtt_blink.js"></script>
    <script> 
    jQuery().ready(function(){
      getData();
      
      setInterval('getData()',3000);
    });
    function getData(){ 
      jQuery.post('mqttdb.php',function( data ) {
        jQuery('#database').html(data);
      });
    }
    $.get('header.html', function(data){
      $('#includeHeader').prepend(data);
      var x = location.hostname;
      for (let i = 1; i < 6; i++) {
        if(x == "iot4school" + i) {
          $('#logo').attr('src', 'icons/logo' + i + '.png');
          $('#logo').attr('width', '350');
        }
      }
      $('body').fadeIn(500);
    });
    </script>
  </head>

  <body>
    <header>
      <div id="includeHeader"></div>
    </header>
    
    <div class="container">
      <div class="content">
        <h2>Willkommen im Internet der Dinge!</h2>
        <div id="database"></div>
      </div>
      <p>Für Lehrkräfte: Datenbankeinträge lassen sich mithilfe der <a href="phpliteadmin">Datenbankverwaltung</a> jederzeit editieren.</p>
    </div>
  </body>

  <footer>
   <p>Die Onlinedokumentation findest du bei <a href="https://github.com/esdkrwl/IoT4School">Github</a>.</p>
  </footer>

</html>
