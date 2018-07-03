const { getProviderPlugins } = require('./get-provider-plugins');

async function executeProviderUtils(context, provider, utilName, options) {
  const providerPlugins = getProviderPlugins(context);
  const pluginModule = require(providerPlugins[provider]);

  return await pluginModule.providerUtils[utilName](context, options);
}

module.exports = {
  executeProviderUtils,
};
