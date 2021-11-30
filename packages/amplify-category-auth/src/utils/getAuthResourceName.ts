import { $TSContext } from 'amplify-cli-core';

export const getAuthResourceName = async (context: $TSContext) => {
  const { allResources } = await context.amplify.getResourceStatus();
  const authResource = allResources.filter((resource: { service: string }) => resource.service === 'Cognito');
  let authResourceName;

  if (authResource.length > 0) {
    const resource = authResource[0];
    authResourceName = resource.resourceName;
  } else {
    throw new Error('Cognito UserPool does not exists');
  }
  return authResourceName;
};
