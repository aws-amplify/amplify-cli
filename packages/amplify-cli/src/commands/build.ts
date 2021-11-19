import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
/**
 * Command to transform CFN with overrides
 */
const subcommand = 'build';

export const run = async (context: $TSContext) => {
  const categoryName = context?.input?.subCommands?.[0];
  let resourceName = context?.input?.subCommands?.[1];
  if (categoryName === undefined) {
    // if no category is mentioned , then defaults to all resource
    resourceName = undefined;
  }

  try {
    await generateDependentResourcesType(context);
    const resourcesToBuild: IAmplifyResource[] = await getResources(context);
    let filteredResources: IAmplifyResource[] = resourcesToBuild;
    if (categoryName) {
      filteredResources = filteredResources.filter(resource => resource.category === categoryName);
    }
    if (categoryName && resourceName) {
      filteredResources = filteredResources.filter(
        resource => resource.category === categoryName && resource.resourceName === resourceName,
      );
    }
    if (!categoryName && !resourceName) {
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'transformResourceWithOverrides', [context]);
    }
    for (const resource of filteredResources) {
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'transformResourceWithOverrides', [
        context,
        resource,
      ]);
    }
  } catch (err) {
    printer.error(err.stack);
    printer.error('There was an error building the resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};

export const getResources = async (context: $TSContext): Promise<IAmplifyResource[]> => {
  const resources: IAmplifyResource[] = [];
  const { resourcesToBeCreated, resourcesToBeUpdated } = await context.amplify.getResourceStatus();
  resourcesToBeCreated.forEach((resourceCreated: IAmplifyResource) => {
    resources.push({
      service: resourceCreated.service,
      category: resourceCreated.category,
      resourceName: resourceCreated.resourceName,
    });
  });

  resourcesToBeUpdated.forEach((resourceUpdated: IAmplifyResource) => {
    resources.push({
      service: resourceUpdated.service,
      category: resourceUpdated.category,
      resourceName: resourceUpdated.resourceName,
    });
  });
  return resources;
};
