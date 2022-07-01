/* eslint-disable no-param-reassign */
import { $TSAny, $TSMeta, AmplifyCategories, stateManager } from 'amplify-cli-core';

/**
 *
 */
export const getResourceOutputs = (amplifyMeta: $TSMeta) => {
  if (!amplifyMeta) {
    amplifyMeta = stateManager.getMeta();
  }
  // Build the provider object
  const outputsByProvider: { serviceResourceMapping?; awscloudformation? } = {};
  const outputsByCategory = {};
  const outputsForFrontend = {
    metadata: {},
    serviceResourceMapping: {},
    testMode: false,
  };

  if (amplifyMeta.providers) {
    Object.keys(amplifyMeta.providers).forEach(provider => {
      outputsByProvider[provider] = {};
      outputsByProvider[provider].metadata = amplifyMeta.providers[provider] || {};
      outputsByProvider[provider].serviceResourceMapping = {};
    });
  }

  if (amplifyMeta) {
    Object.keys(amplifyMeta).forEach(category => {
      const categoryMeta = amplifyMeta[category];
      const isVirtualCategory = checkIfVirtualCategory(category);
      Object.keys(categoryMeta).forEach(resourceName => {
        const resourceMeta = categoryMeta[resourceName];

        if (resourceMeta.output && (resourceMeta.lastPushTimeStamp || isVirtualCategory)) {
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

/**
 * A virtual category is a category where its resource is allocated and managed by a different plugin.
 * e.g. Notifications category only manages channel configuration on a Pinpoint resource managed by the Analytics category.
 * @param category amplify category
 */
const checkIfVirtualCategory = (category: string): boolean => {
  const virtualCategoryTable = [AmplifyCategories.NOTIFICATIONS];
  if (virtualCategoryTable.includes(category)) {
    return true;
  }
  return false;
};
