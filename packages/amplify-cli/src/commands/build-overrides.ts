import { $TSContext, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
/**
 * Command to transform CFN with overrides
 */
const subcommand = 'build-overrides';

export const run = async (context: $TSContext) => {
  const resourceName = context?.input?.subCommands?.[0];
  const categoryName = context?.input?.subCommands?.[1];
  const confirmContinue =
    !!resourceName ||
    context.input?.options?.yes ||
    (await context.amplify.confirmPrompt('Are you sure you want to continue building the resources?', false));
  if (!confirmContinue) {
    return;
  }
  try {
    const resourcesToBuild: IAmplifyResource[] = await getResources(context);
    for (const resource of resourcesToBuild) {
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'transformCfnWithOverrides', [context, resource]);
    }
  } catch (err) {
    printer.error(err.stack);
    printer.error('There was an error building the resource');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }
};

const getResources = async (context: $TSContext): Promise<IAmplifyResource[]> => {
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
