const { printAuthErrorMessage } = require('./aws-utils/aws-amplify');
const { fileLogger } = require('./utils/aws-logger');
const logger = fileLogger('amplify-service-permission-check');
async function checkAmplifyServiceIAMPermission(context, amplifyClient) {
    let hasAmplifyServicePermission = true;
    const log = logger('checkAmplifyServiceIAMPermission.amplifyClient.listApps', []);
    try {
        log();
        await amplifyClient.listApps().promise();
    }
    catch (e) {
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
//# sourceMappingURL=amplify-service-permission-check.js.map