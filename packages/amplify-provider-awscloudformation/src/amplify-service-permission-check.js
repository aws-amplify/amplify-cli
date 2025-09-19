const { printAuthErrorMessage } = require('./aws-utils/aws-amplify');
const { fileLogger } = require('./utils/aws-logger');
const { ListAppsCommand } = require('@aws-sdk/client-amplify');
const logger = fileLogger('amplify-service-permission-check');

async function checkAmplifyServiceIAMPermission(context, amplifyClient) {
  let hasAmplifyServicePermission = true;
  const log = logger('checkAmplifyServiceIAMPermission.amplifyClient.listApps', []);

  try {
    log();
    await amplifyClient.send(new ListAppsCommand({}));
  } catch (e) {
    log(e);
    if (e.name === 'UnauthorizedException') {
      printAuthErrorMessage(context);
      hasAmplifyServicePermission = false;
    }
  }
  return hasAmplifyServicePermission;
}

module.exports = {
  checkAmplifyServiceIAMPermission,
};
