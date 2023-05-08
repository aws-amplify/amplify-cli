import {
  $TSContext,
  AmplifyError,
  AmplifyFault,
  AMPLIFY_SUPPORT_DOCS,
  exitOnNextTick,
  IAmplifyResource,
  stateManager,
  ManuallyTimedCodePath,
  LocalEnvInfo,
} from '@aws-amplify/amplify-cli-core';
import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { printer, prompter } from '@aws-amplify/amplify-prompts';
import { getChangedResources } from '../../commands/build';
import { initializeEnv } from '../../initialize-env';
import { getEnvInfo } from './get-env-info';
import { getProjectConfig } from './get-project-config';
import { getProviderPlugins } from './get-provider-plugins';
import { onCategoryOutputsChange } from './on-category-outputs-change';
import { showResourceTable } from './resource-status';
import { isValidGraphQLAuthError, handleValidGraphQLAuthError } from './apply-auth-mode';
import { showBuildDirChangesMessage } from './auto-updates';
import { verifyExpectedEnvParams } from '../../utils/verify-expected-env-params';

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

  if (context.parameters.options?.['iterative-rollback']) {
    // validate --iterative-rollback with --force
    if (context.parameters.options?.force) {
      throw new AmplifyError('CommandNotSupportedError', {
        message: '--iterative-rollback and --force are not supported together',
        resolution: 'Use --force without --iterative-rollback to iteratively rollback and redeploy.',
      });
    }
    context.exeInfo.iterativeRollback = true;
  }

  if (context.parameters.options?.env) {
    const envName: string = context.parameters.options.env;
    const allEnvs = context.amplify.getAllEnvs();

    if (allEnvs.findIndex((env) => env === envName) !== -1) {
      context.exeInfo = { inputParams: {}, localEnvInfo: {} as unknown as LocalEnvInfo };
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
      throw new AmplifyError('EnvironmentNotInitializedError', {
        message: 'Current environment cannot be determined.',
        resolution: `Use 'amplify init' in the root of your app directory to create a new environment.`,
      });
    }
  }

  // building all CFN stacks here to get the resource Changes
  await generateDependentResourcesType();
  const resourcesToBuild: IAmplifyResource[] = await getChangedResources(context, category, resourceName, filteredResources);
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
    context.usageData.stopCodePathTimer(ManuallyTimedCodePath.PUSH_TRANSFORM);
    return false;
  }

  await verifyExpectedEnvParams(context, category, resourceName);

  // rebuild has an upstream confirmation prompt so no need to prompt again here
  let continueToPush = !!context?.exeInfo?.inputParams?.yes || rebuild;

  if (!continueToPush) {
    if (context.exeInfo.iterativeRollback) {
      printer.info('The CLI will rollback the last known iterative deployment.');
    }
    await showBuildDirChangesMessage();
    continueToPush = await prompter.yesOrNo('Are you sure you want to continue?');
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
      // TODO PL: this needs to be removed once the api category is using the new amplify error class
      const isAuthError = isValidGraphQLAuthError(err.message);
      if (isAuthError) {
        retryPush = await handleValidGraphQLAuthError(context, err.message);
      }
      if (!retryPush) {
        throw new AmplifyFault(
          'PushResourcesFault',
          {
            message: err.message,
            details: err.details,
            link: isAuthError ? AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url : AMPLIFY_SUPPORT_DOCS.CLI_PROJECT_TROUBLESHOOTING.url,
            resolution: isAuthError
              ? 'Some @auth rules are defined in the GraphQL schema without enabling the corresponding auth providers. Run `amplify update api` to configure your GraphQL API to include the appropriate auth providers as an authorization mode.'
              : undefined,
          },
          err,
        );
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

  await Promise.all(
    providers.map(async (provider: string) => {
      const providerModule = await import(providerPlugins[provider]);
      const resourceDefinition = await context.amplify.getResourceStatus(category, resourceName, provider, filteredResources);
      return await providerModule.pushResources(context, resourceDefinition, rebuild);
    }),
  );
};
