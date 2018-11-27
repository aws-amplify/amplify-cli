async function showHelpfulProviderLinks(context) {
  const { getProjectConfig } = require('./get-project-config');
  const { getResourceStatus } = require('./resource-status');

  const { providers } = getProjectConfig();
  const providerPromises = [];

  const {
    allResources,
  } = await getResourceStatus();

  Object.keys(providers).forEach((providerName) => {
    const pluginModule = require(providers[providerName]);
    providerPromises.push(pluginModule.showHelpfulLinks(context, allResources));
  });

  return Promise.all(providerPromises);
}

module.exports = {
  showHelpfulProviderLinks,
};
