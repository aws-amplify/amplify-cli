var currentdate = new Date();
var datetime = "Current time: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();
// eslint-disable-next-line
document.getElementById("welcome").innerHTML = datetime;