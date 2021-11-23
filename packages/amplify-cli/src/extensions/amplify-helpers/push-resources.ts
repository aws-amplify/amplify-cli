import { $TSAny, $TSContext, EnvironmentDoesNotExistError, exitOnNextTick, IAmplifyResource, stateManager } from 'amplify-cli-core';
import { getResources } from '../../commands/build';
import { initializeEnv } from '../../initialize-env';
import { getEnvInfo } from './get-env-info';
import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';
import { onCategoryOutputsChange } from './on-category-outputs-change';
import { showResourceTable } from './resource-status';
import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { isValidGraphQLAuthError, handleValidGraphQLAuthError } from './apply-auth-mode';
import { printer } from 'amplify-prompts';

export async function pushResources(
  context: $TSContext,
  category?: string,
  resourceName?: string,
  filteredResources?: { category: string; resourceName: string }[],
  rebuild: boolean = false,
) {
  if (context.parameters.options['iterative-rollback']) {
    // validate --iterative-rollback with --force
    if (context.parameters.options.force) {
      throw new Error(
        "'--iterative-rollback' and '--force' cannot be used together. Consider runnning 'amplify push --force' to iteratively rollback and redeploy.",
      );
    }
    context.exeInfo.iterativeRollback = true;
  }
  if (context.parameters.options.env) {
    const envName: string = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs();

    if (allEnvs.findIndex(env => env === envName) !== -1) {
      context.exeInfo = {};
      context.exeInfo.forcePush = false;

      context.exeInfo.projectConfig = stateManager.getProjectConfig(undefined, {
        throwIfNotExist: false,
      });

      context.exeInfo.localEnvInfo = getEnvInfo();
      if (context.exeInfo.localEnvInfo.envName !== envName) {
        context.exeInfo.localEnvInfo.envName = envName;
        stateManager.setLocalEnvInfo(context.exeInfo.localEnvInfo.projectPath, context.exeInfo.localEnvInfo);
      }
      await initializeEnv(context);
    } else {
      const errMessage = "Environment doesn't exist. Please use 'amplify init' to create a new environment";

      context.print.error(errMessage);
      await context.usageData.emitError(new EnvironmentDoesNotExistError(errMessage));

      exitOnNextTick(1);
    }
  }

  // building all CFN stacks here to get the resource Changes
  await generateDependentResourcesType(context);
  const resourcesToBuild: IAmplifyResource[] = await getResources(context);
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
    resourcesToBuild,
    forceCompile: true,
  });

  let hasChanges: boolean = false;
  if (!rebuild) {
    // status table does not have a way to show resource in "rebuild" state so skipping it to avoid confusion
    hasChanges = !!(await showResourceTable(category, resourceName, filteredResources));
  }

  // no changes detected
  if (!hasChanges && !context.exeInfo.forcePush && !rebuild) {
    context.print.info('\nNo changes detected');

    return context;
  }

  // rebuild has an upstream confirmation prompt so no need to prompt again here
  let continueToPush = (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes) || rebuild;

  if (!continueToPush) {
    if (context.exeInfo.iterativeRollback) {
      context.print.info('The CLI will rollback the last known iterative deployment.');
    }
    continueToPush = await context.amplify.confirmPrompt('Are you sure you want to continue?');
  }

  let retryPush;
  if (continueToPush) {
    do {
      retryPush = false;
      try {
        // Get current-cloud-backend's amplify-meta
        const currentAmplifyMeta = stateManager.getCurrentMeta();

        await providersPush(context, rebuild, category, resourceName, filteredResources);
        await onCategoryOutputsChange(context, currentAmplifyMeta);
      } catch (err) {
        const isAuthError = isValidGraphQLAuthError(err.message);
        if (isAuthError) {
          retryPush = await handleValidGraphQLAuthError(context, err.message);
        }
        if (!retryPush) {
          if (isAuthError) {
            printer.warn(
              `You defined authorization rules (@auth) but haven't enabled their authorization providers on your GraphQL API. Run "amplify update api" to configure your GraphQL API to include the appropriate authorization providers as an authorization mode.`,
            );
            printer.error(err.message);
          }
          throw err;
        }
      }
    } while (retryPush);
  } else {
    // there's currently no other mechanism to stop the execution of the postPush workflow in this case, so exiting here
    exitOnNextTick(1);
  }

  return continueToPush;
}

async function providersPush(
  context: $TSContext,
  rebuild: boolean = false,
  category?: string,
  resourceName?: string,
  filteredResources?: { category: string; resourceName: string }[],
) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<$TSAny>)[] = [];

  for (const provider of providers) {
    const providerModule = require(providerPlugins[provider]);
    const resourceDefinition = await context.amplify.getResourceStatus(category, resourceName, provider, filteredResources);
    providerPromises.push(providerModule.pushResources(context, resourceDefinition, rebuild));
  }

  await Promise.all(providerPromises);
}

export async function storeCurrentCloudBackend(context: $TSContext) {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);
  const providerPromises: (() => Promise<$TSAny>)[] = [];

  for (const provider of providers) {
    const providerModule = require(providerPlugins[provider]);
    providerPromises.push(providerModule.storeCurrentCloudBackend(context));
  }

  await Promise.all(providerPromises);
}
