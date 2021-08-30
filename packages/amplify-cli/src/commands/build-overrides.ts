import { $TSContext, overriddenCategories, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { transformCfnWithOverrides } from 'amplify-provider-awscloudformation';

/**
 * Command to transform CFN with overrides
 */
const subcommand = 'build-overrides';

export const run = async (context: $TSContext) => {
  try {
    await transformCfnWithOverrides(context, 'auth', 'extauth38706339487063394');
  } catch (err) {
    printer.error(err.stack);
    printer.error('There was an error overriding the resources');
    context.usageData.emitError(err);
    process.exitCode = 1;
  }

  // const resourceName = context?.input?.subCommands?.[0];
  // const confirmContinue =
  //   !!resourceName ||
  //   context.input?.options?.yes ||
  //   (await context.amplify.confirmPrompt('Are you sure you want to continue building the resources?', false));
  // if (!confirmContinue) {
  //   return;
  // }
  // try {
  //   const resourcesToBuild : IAmplifyResource[] = await getResources(context, resourceName);
  //   for await (const resource of resourcesToBuild) {
  //     transformCfnWithOverrides(context,resource.category , resource.resourceName);
  //   }
  // } catch (err) {
  //   printer.error(err.stack);
  //   printer.error('There was an error building the function resources');
  //   context.usageData.emitError(err);
  //   process.exitCode = 1;
  // }
};

const getResources = async (context: $TSContext, resourceName?: string): Promise<IAmplifyResource[]> => {
  const resources: IAmplifyResource[] = [];
  overriddenCategories.forEach(async categoryName => {
    resources.push(await context.amplify.getResourceStatus(categoryName, resourceName).allResources);
  });
  return resources;
};
