const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');
const utils = require('../../utils/amplify-context-utils');
async function initEnv(context) {
    const category = constants.CATEGORY;
    const resourceName = constants.CONSOLE_RESOURCE_NAME;
    const type = constants.TYPE_CICD;
    await configUtils.initHostingEnvParams(context, category, resourceName, type);
    context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, type, constants.TYPE_CICD);
    const metaContent = utils.getMetaInfo(context);
    const { lastPushTimeStamp } = metaContent[category][resourceName];
    await configUtils.initCurrBackendMeta(context, category, resourceName, type, lastPushTimeStamp);
}
module.exports = {
    initEnv,
};
//# sourceMappingURL=initEnv.js.map