const pathManager = require('./path-manager');
const { readJsonFile } = require('./read-json-file');

function getResourceOutputs(amplifyMeta) {
  if (!amplifyMeta) {
    const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
    amplifyMeta = readJsonFile(amplifyMetaFilePath);
  }

  // Build the provider object
  const outputsByProvider = {};
  const outputsByCategory = {};
  const outputsForFrontend = {
    metadata: {},
    serviceResourceMapping: {},
  };

  if (amplifyMeta.providers) {
    Object.keys(amplifyMeta.providers).forEach((provider) => {
      outputsByProvider[provider] = {};
      outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
      outputsByProvider[provider].serviceResourceMapping = {};
    });
  }

  if (amplifyMeta) {
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

          resourceMeta.resourceName = resourceName;
          outputsForFrontend.serviceResourceMapping[resourceMeta.service].push(resourceMeta);
        }
      });
    });
  }

  if (outputsByProvider.awscloudformation) {
    outputsForFrontend.metadata = outputsByProvider.awscloudformation.metadata;
  }
  if (amplifyMeta && amplifyMeta.testMode) {
    outputsForFrontend.testMode = true;
  }
  return { outputsByProvider, outputsByCategory, outputsForFrontend };
}

module.exports = {
  getResourceOutputs,
};
