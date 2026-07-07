const constants = require('../../constants/plugin-constants');
const configUtils = require('../../utils/config-utils');

async function initEnv(context) {
  // Constants
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_MANUAL;

  // Init team-provider-info
  await configUtils.initHostingEnvParams(context, category, resourceName, type);
}

module.exports = {
  initEnv,
};
