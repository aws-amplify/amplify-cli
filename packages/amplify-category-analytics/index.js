const opn = require('opn');
const pinpointHelper = require('./lib/pinpoint-helper');

function console(context) {
  context.exeInfo = context.amplify.getProjectDetails();
  if (pinpointHelper.checkPinpointEnabledAndPushed(context)) {
    const { Region, Id } = context.exeInfo.serviceMeta.output;
    const consoleUrl =
          `https://console.aws.amazon.com/pinpoint/home/?region=${Region}#/apps/${Id}/analytics/`;
    opn(consoleUrl, { wait: false });
  } else {
    context.print.error('analytics has NOT been added and pushed to the cloud.');
  }
}

module.exports = {
  console,
};

