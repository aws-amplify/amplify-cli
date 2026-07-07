const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');
const utils = require('../../utils/amplify-context-utils');

async function initEnv(context) {
  // Constants
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_CICD;

  // Init team-provider-info
  await configUtils.initHostingEnvParams(context, category, resourceName, type);

  // Update #current-cloud-backend
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, type, constants.TYPE_CICD);
  const metaContent = utils.getMetaInfo(context);
  const { lastPushTimeStamp } = metaContent[category][resourceName];
  await configUtils.initCurrBackendMeta(context, category, resourceName, type, lastPushTimeStamp);
}

module.exports = {
  initEnv,
};
