const { printAuthErrorMessage } = require('../src/aws-utils/aws-amplify');

async function authDryRun(context, amplifyClient) {
  let hasAmplifyServicePermission = true;
  try {
    await amplifyClient.listApps().promise();
  } catch (e) {
    if (e.code === 'UnauthorizedException') {
      printAuthErrorMessage(context);
      hasAmplifyServicePermission = false;
    }
  }
  return hasAmplifyServicePermission;
}

module.exports = {
  authDryRun,
};
