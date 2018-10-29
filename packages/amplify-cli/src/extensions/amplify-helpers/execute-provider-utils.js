const { getProviderPlugins } =  require('./get-provider-plugins');

async function executeProviderUtils(context, providerName, utilName, options) {
  const providerPlugins = getProviderPlugins(context);
  const pluginModule = require(providerPlugins[providerName]);
  return await pluginModule.providerUtils[utilName](context, options);
}

module.exports = {
  executeProviderUtils,
};
