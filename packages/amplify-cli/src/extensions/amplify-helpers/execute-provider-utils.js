const { getProjectConfig } = require('./get-project-config');

async function executeProviderUtils(context, providerName, utilName, options) {
  const { providers } = getProjectConfig();
  const pluginModule = require(providers[providerName]);
  return await pluginModule.providerUtils[utilName](context, options);
}

module.exports = {
  executeProviderUtils,
};
