// Build all the cfn files for categories  that support overrides

import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { IAmplifyResource } from 'amplify-cli-core';

export async function buildOverridesEnabledResources(context) {
  const resourcesToBuild: IAmplifyResource[] = [];
  const { allResources } = await context.amplify.getResourceStatus();

  allResources.forEach(resourceCreated => {
    resourcesToBuild.push({
      service: resourceCreated.service as string,
      category: resourceCreated.category as string,
      resourceName: resourceCreated.resourceName as string,
    });
  });

  await generateDependentResourcesType(context);
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
    resourcesToBuild: allResources,
    forceCompile: true,
  });
}
