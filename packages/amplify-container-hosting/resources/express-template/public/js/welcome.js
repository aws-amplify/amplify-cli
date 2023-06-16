var currentDate = new Date();
var datetime =
  'Current time: ' +
  currentDate.getDate() +
  '/' +
  (currentDate.getMonth() + 1) +
  '/' +
  currentDate.getFullYear() +
  ' @ ' +
  currentDate.getHours() +
  ':' +
  currentDate.getMinutes() +
  ':' +
  currentDate.getSeconds();
// eslint-disable-next-line
document.getElementById('welcome').innerHTML = datetime;
