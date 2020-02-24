const constants = require('../../constants/plugin-constants');
const path = require('path');
const configUtils = require('../../utils/config-utils');

function enable(context) {
  // Constants
  const category = constants.CATEGORY;
  const resourceName = constants.CONSOLE_RESOURCE_NAME;
  const type = constants.TYPE_MANUAL;

  // Init template
  const templateFilePath = path.join(__dirname, '..', constants.TEMPLATE_DIR, constants.TEMPLATE_FILE_NAME);
  configUtils.initCFNTemplate(context, templateFilePath);

  // Init meta
  configUtils.initMetaFile(context, category, resourceName, type);

  // Init team-provider-info
  configUtils.initTeamProviderInfo(context, category, resourceName, type);

  // Init backend config
  configUtils.initBackendConfig(context, category, resourceName, type);
}

module.exports = {
  enable,
};
