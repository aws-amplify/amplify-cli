const opn = require('opn');
const pinpointHelper = require('./lib/pinpoint-helper');

function console(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  if (pinpointHelper.checkPinpointEnabled(context)) {
    const { Region, Id } = context.exeInfo.serviceMeta.output;
    const consoleUrl =
          `https://console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/`;
    opn(consoleUrl, { wait: false });
  } else {
    context.print.error('analytics is NOT added to the backend.');
  }
}

module.exports = {
  console,
};

