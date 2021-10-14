import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
/**
 * Command to transform CFN with overrides
 */
const subcommand = 'build-override';

export const run = async (context: $TSContext) => {
  const categoryName = context?.input?.subCommands?.[0];
  let resourceName = context?.input?.subCommands?.[1];
  if (categoryName === undefined) {
    // if no category is mentioned , then defaults to all resource
    resourceName = undefined;
  }

  try {
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
  resourcesToBeCreated.forEach(resourceCreated => {
    resources.push({
      service: resourceCreated.service as string,
      category: resourceCreated.category as string,
      resourceName: resourceCreated.resourceName as string,
    });
  });

  resourcesToBeUpdated.forEach(resourceUpdated => {
    resources.push({
      service: resourceUpdated.service as string,
      category: resourceUpdated.category as string,
      resourceName: resourceUpdated.resourceName as string,
    });
  });
  return resources;
};
