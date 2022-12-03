import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { $TSContext, $TSObject, IAmplifyResource } from 'amplify-cli-core';

/**
 * Build all the cfn files for categories  that support overrides
 */
export const buildOverridesEnabledResources = async (context: $TSContext, resources?: $TSObject[]): Promise<void> => {
  const resourcesToBuild: IAmplifyResource[] = [];
  let allBuildResources: $TSObject[] = [];
  if (resources !== undefined && resources.length > 0) {
    allBuildResources = resources;
  } else {
    const { allResources } = await context.amplify.getResourceStatus();
    allBuildResources = allResources;
  }
  allBuildResources.forEach(resourceCreated => {
    resourcesToBuild.push({
      service: resourceCreated.service as string,
      category: resourceCreated.category as string,
      resourceName: resourceCreated.resourceName as string,
    });
  });
  await generateDependentResourcesType();
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
    resourcesToBuild,
    forceCompile: true,
  });
};
