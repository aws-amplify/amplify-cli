const opn = require('opn');
const pinpointHelper = require('./lib/pinpoint-helper');

function console(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  if (pinpointHelper.existsPinpointApp(context)) {
    const { Region, Id } = context.exeInfo.serviceMeta.output;
    const consoleUrl =
          `https://console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/notifications/`;
    opn(consoleUrl, { wait: false });
  } else {
    context.print.error('notifications has NOT been added and pushed to the cloud.');
  }
}

module.exports = {
  console,
};

