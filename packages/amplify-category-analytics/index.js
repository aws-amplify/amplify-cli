const pinpointHelper = require('./lib/pinpoint-helper');

function console(context) {
  pinpointHelper.console(context);
}

module.exports = {
  console,
};

