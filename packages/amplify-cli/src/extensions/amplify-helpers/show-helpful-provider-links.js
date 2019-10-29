const { getProjectConfig } = require('./get-project-config');
const { getResourceStatus } = require('./resource-status');
const { getProviderPlugins } = require('./get-provider-plugins');

async function showHelpfulProviderLinks(context) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises = [];

  const { allResources } = await getResourceStatus();

  providers.forEach(providerName => {
    const pluginModule = require(providerPlugins[providerName]);
    providerPromises.push(pluginModule.showHelpfulLinks(context, allResources));
  });

  return Promise.all(providerPromises);
}

module.exports = {
  showHelpfulProviderLinks,
};
