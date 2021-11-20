import { $TSContext } from 'amplify-cli-core';

export const getAppSyncApiResourceName = async (context: $TSContext): Promise<string> => {
  const { allResources } = await context.amplify.getResourceStatus();
  const apiResource = allResources.filter((resource: { service: string }) => resource.service === 'AppSync');
  let apiResourceName;

  if (apiResource.length > 0) {
    const resource = apiResource[0];
    apiResourceName = resource.resourceName;
  } else {
    throw new Error('AppSync Api does not exists, Do add an api , use a `amplify update api`');
  }
  return apiResourceName;
};
