const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');

function initEnv(context) {
  // Constants
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_MANUAL;

  // Init team-provider-info
  configUtils.initTeamProviderInfo(context, category, resourceName, type);
}

module.exports = {
  initEnv,
};
