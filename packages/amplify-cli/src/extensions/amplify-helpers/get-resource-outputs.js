const fs = require('fs');
const pathManager = require('./path-manager');

function getResourceOutputs() {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  // Build the provider object
  const outputsByProvider = {};
  const outputsByCategory = {};
  const outputsForFrontend = {
    metadata: {},
    serviceResourceMapping: {},
  };

  Object.keys(amplifyMeta.providers).forEach((provider) => {
    outputsByProvider[provider] = {};
    outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
    outputsByProvider[provider].serviceResourceMapping = {};
  });

  Object.keys(amplifyMeta).forEach((category) => {
    const categoryMeta = amplifyMeta[category];
    Object.keys(categoryMeta).forEach((resourceName) => {
      const resourceMeta = categoryMeta[resourceName];
      if (resourceMeta.output && resourceMeta.lastPushTimeStamp) {
        const { providerPlugin } = resourceMeta;
        if (!outputsByProvider[providerPlugin]) {
          outputsByProvider[providerPlugin] = {
            metadata: {},
            serviceResourceMapping: {},
          };
        }
        if (!outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service]) {
          outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service] = [];
        }
        /*eslint-disable*/
        outputsByProvider[providerPlugin].serviceResourceMapping[resourceMeta.service].push(resourceMeta);
         /* eslint-enable */
        if (!outputsByCategory[category]) {
          outputsByCategory[category] = {};
        }
        if (resourceMeta.service) {
          resourceMeta.output.service = resourceMeta.service;
        }
        outputsByCategory[category][resourceName] = resourceMeta.output;

        // for frontend configuration file generation
        if (!outputsForFrontend.serviceResourceMapping[resourceMeta.service]) {
          outputsForFrontend.serviceResourceMapping[resourceMeta.service] = [];
        }
        outputsForFrontend.serviceResourceMapping[resourceMeta.service].push(resourceMeta);
      }
    });
  });

  if (outputsByProvider.awscloudformation) {
    outputsForFrontend.metadata = outputsByProvider.awscloudformation.metadata;
  }

  return { outputsByProvider, outputsByCategory, outputsForFrontend };
}

module.exports = {
  getResourceOutputs,
};
