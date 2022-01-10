import { $TSContext, AmplifySupportedService } from 'amplify-cli-core';

export const getAppSyncApiResourceName = async (context: $TSContext): Promise<string> => {
  const { allResources } = await context.amplify.getResourceStatus();
  const apiResource = allResources.filter((resource: { service: string }) => resource.service === AmplifySupportedService.APPSYNC);
  let apiResourceName;

  if (apiResource.length > 0) {
    const resource = apiResource[0];
    apiResourceName = resource.resourceName;
  } else {
    throw new Error(`${AmplifySupportedService.APPSYNC} API does not exist. To add an api, use "amplify update api".`);
  }
  return apiResourceName;
};
