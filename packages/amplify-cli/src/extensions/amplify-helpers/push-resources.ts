import {
  $TSContext, EnvironmentDoesNotExistError, exitOnNextTick, IAmplifyResource, stateManager,
} from 'amplify-cli-core';
import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { printer } from 'amplify-prompts';
import { getResources } from '../../commands/build';
import { initializeEnv } from '../../initialize-env';
import { getEnvInfo } from './get-env-info';
import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';
import { onCategoryOutputsChange } from './on-category-outputs-change';
import { showResourceTable } from './resource-status';
import { isValidGraphQLAuthError, handleValidGraphQLAuthError } from './apply-auth-mode';
import { ManuallyTimedCodePath } from '../../domain/amplify-usageData/UsageDataTypes';
/**
 * Entry point for pushing resources to the cloud
 */
export const pushResources = async (
  context: $TSContext,
  category?: string,
  resourceName?: string,
  filteredResources?: { category: string; resourceName: string }[],
  rebuild = false,
): Promise<boolean> => {
  context.usageData.startCodePathTimer(ManuallyTimedCodePath.PUSH_TRANSFORM);
  if (context.parameters.options['iterative-rollback']) {
    // validate --iterative-rollback with --force
    if (context.parameters.options.force) {
      throw new Error(
        "'--iterative-rollback' and '--force' cannot be used together. Consider running 'amplify push --force' to iteratively rollback and redeploy.",
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
  // console.log('SACPCDEBUG: Amplify Push: all resources to be pushed!!', JSON.stringify(resourcesToBuild, null, 2));
  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'buildOverrides', {
    resourcesToBuild,
    forceCompile: true,
  });

  let hasChanges = false;
  if (!rebuild) {
    // status table does not have a way to show resource in "rebuild" state so skipping it to avoid confusion
    hasChanges = !!(await showResourceTable(category, resourceName, filteredResources));
  }

  // no changes detected
  if (!hasChanges && !context.exeInfo.forcePush && !rebuild) {
    printer.info('\nNo changes detected');

    return false;
  }

  // rebuild has an upstream confirmation prompt so no need to prompt again here
  let continueToPush = !!context?.exeInfo?.inputParams?.yes || rebuild;

  if (!continueToPush) {
    if (context.exeInfo.iterativeRollback) {
      printer.info('The CLI will rollback the last known iterative deployment.');
    }
    continueToPush = await context.amplify.confirmPrompt('Are you sure you want to continue?');
  }

  if (!continueToPush) {
    // there's currently no other mechanism to stop the execution of the postPush workflow in this case, so exiting here
    exitOnNextTick(1);
  }
  let retryPush;
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
            'You defined authorization rules (@auth) but haven\'t enabled their authorization providers on your GraphQL API. Run "amplify update api" to configure your GraphQL API to include the appropriate authorization providers as an authorization mode.',
          );
          printer.error(err.message);
        }
        throw err;
      }
    }
  } while (retryPush);

  return continueToPush;
};

const providersPush = async (
  context: $TSContext,
  rebuild = false,
  category?: string,
  resourceName?: string,
  filteredResources?: { category: string; resourceName: string }[],
): Promise<void> => {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);

  await Promise.all(providers.map(async provider => {
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const providerModule = require(providerPlugins[provider]);
    const resourceDefinition = await context.amplify.getResourceStatus(category, resourceName, provider, filteredResources);
    return providerModule.pushResources(context, resourceDefinition, rebuild);
  }));
};

/**
 * Delegates storeCurrentCloudBackend to all providers (just aws cfn provider)
 */
export const storeCurrentCloudBackend = async (context: $TSContext): Promise<void> => {
  const { providers } = getProjectConfig();
  const providerPlugins = getProviderPlugins(context);

  Promise.all(providers.map(provider => {
    // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
    const providerModule = require(providerPlugins[provider]);
    return providerModule.storeCurrentCloudBackend(context);
  }));
};
