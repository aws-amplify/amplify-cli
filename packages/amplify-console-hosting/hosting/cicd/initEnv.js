const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');
const utis = require('../../utils/amplify-context-utils');

function initEnv(context) {
  // Constants
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_CICD;

  // Init team-provider-info
  configUtils.initTeamProviderInfo(context, category, resourceName, type);

  // Update #current-cloud-backend
  context
    .amplify
    .updateamplifyMetaAfterResourceUpdate(category, resourceName, type, constants.TYPE_CICD);
  const metaContent = utis.getMetaInfo(context);
  const { lastPushTimeStamp } = metaContent[category][resourceName];
  configUtils.initCurrBackendMeta(context, category, resourceName, type, lastPushTimeStamp);
}

module.exports = {
  initEnv,
};
