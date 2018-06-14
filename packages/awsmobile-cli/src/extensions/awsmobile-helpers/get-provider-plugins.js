function getPlugins() {
  const providerDetailsList = [];
  const pluginConfig = {
    providerPlugins: {
      'awsmobile-provider-cloudformation': {
        name: 'AWS Cloudformation',
        path: 'awsmobile-provider-cloudformation',
      },
    },
    frontendPlugins: [],
    defaultProviders: [
      'awsmobile-provider-cloudformation',
    ],
  };
  const providerPlugins = pluginConfig.defaultProviders;

  for (let i = 0; i < providerPlugins.length; i += 1) {
    const providerPluginDetail = pluginConfig.providerPlugins[providerPlugins[i]];
    providerPluginDetail.plugin = providerPlugins[i];
    providerDetailsList.push(providerPluginDetail);
  }
  return providerDetailsList;
}

module.exports = {
  getPlugins,
};
