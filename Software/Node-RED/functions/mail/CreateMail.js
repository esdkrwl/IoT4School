// name: CreateMail
// outputs: 1
msg.to = msg.payload.adresse;

msg.from = "Node-Red-Bot";

msg.topic ="Status-Bericht";

var Nachricht = "Hallo Nutzer. \n" +
"Um " + new Date().toString() + "wurde der " +
"Alarm ausgelöst.";

msg.payload = Nachricht;

return msg;