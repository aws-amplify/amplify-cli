/* eslint-disable */

var opts = {
  lines: 13, // The number of lines to draw
  length: 38, // The length of each line
  width: 17, // The line thickness
  radius: 45, // The radius of the inner circle
  scale: 1, // Scales overall size of the spinner
  corners: 1, // Corner roundness (0..1)
  color: '#ffffff', // CSS color or array of colors
  fadeColor: 'transparent', // CSS color or array of colors
  speed: 1, // Rounds per second
  rotate: 0, // The rotation offset
  animation: 'spinner-line-fade-quick', // The CSS animation name for the lines
  direction: 1, // 1: clockwise, -1: counterclockwise
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  className: 'spinner', // The CSS class to assign to the spinner
  top: '50%', // Top position relative to parent
  left: '50%', // Left position relative to parent
  shadow: '0 0 1px transparent', // Box-shadow for the lines
  position: 'absolute', // Element positioning
};

var target = document.getElementById('myspinner');
var spinner = new Spinner().spin(target);

function confirm() {
  const urlParams = new URLSearchParams(window.location.search);
  const encoded = urlParams.get('data');
  const code = urlParams.get('code');
  const decoded = JSON.parse(atob(encoded));
  const { userName, redirectUrl, clientId, region } = decoded;

  var params = {
    ClientId: clientId,
    ConfirmationCode: code,
    Username: userName,
  };

  AWS.config.region = region;

  var cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();

  cognitoidentityserviceprovider.confirmSignUp(params, function (err, data) {
    if (err) {
      if (err.message === 'User cannot be confirm. Current status is CONFIRMED') {
        window.location.replace(redirectUrl);
      }
    } else {
      window.location.replace(redirectUrl);
    }
  });
}
