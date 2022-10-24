import {
  $TSContext, AmplifyCategories, IAnalyticsResource, stateManager,
} from 'amplify-cli-core';

/**
 * Get all analytics resources. If resourceProviderService name is provided,
 * then only return resources matching the service.
 * @returns Array of resources in Analytics category (IAmplifyResource type)
 */
export const getAnalyticsResources = (context?: $TSContext, resourceProviderServiceName?: string): IAnalyticsResource[] => {
  const resourceList: Array<IAnalyticsResource> = [];
  const amplifyMeta = (context) ? context.exeInfo.amplifyMeta : stateManager.getMeta();
  if (amplifyMeta?.[AmplifyCategories.ANALYTICS]) {
    const categoryResources = amplifyMeta[AmplifyCategories.ANALYTICS];
    Object.keys(categoryResources).forEach(resource => {
      // if resourceProviderService is provided, then only return resources provided by that service
      // else return all resources. e.g. Pinpoint, Kinesis
      if (!resourceProviderServiceName || categoryResources[resource].service === resourceProviderServiceName) {
        resourceList.push({
          category: AmplifyCategories.ANALYTICS,
          resourceName: resource,
          service: categoryResources[resource].service,
          region: categoryResources[resource]?.output?.Region,
          id: categoryResources[resource]?.output?.Id,
          output: categoryResources[resource]?.output,
        });
      }
    });
  }
  return resourceList;
};
