const { printAuthErrorMessage } = require('../src/aws-utils/aws-amplify');
const { fileLogger } = require('../src/utils/aws-logger');
const logger = fileLogger('amplify-service-permission-check');

async function checkAmplifyServiceIAMPermission(context, amplifyClient) {
  let hasAmplifyServicePermission = true;
  const log = logger('checkAmplifyServiceIAMPermission.amplifyClient.listApps', []);

  try {
    log();
    await amplifyClient.listApps().promise();
  } catch (e) {
    log(e);
    if (e.code === 'UnauthorizedException') {
      printAuthErrorMessage(context);
      hasAmplifyServicePermission = false;
    }
  }
  return hasAmplifyServicePermission;
}

module.exports = {
  checkAmplifyServiceIAMPermission,
};
