import {
  $TSAny,
  $TSContext,
  $TSObject,
  AmplifyCategories,
  AmplifySupportedService,
  buildOverrideDir,
  pathManager,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { validateAddApiRequest, validateUpdateApiRequest } from 'amplify-util-headless-input';
import * as fs from 'fs-extra';
import * as path from 'path';
import { run } from './commands/api/console';
import { getAppSyncAuthConfig, getAppSyncResourceName } from './provider-utils/awscloudformation/utils/amplify-meta-utils';
import { provider } from './provider-utils/awscloudformation/aws-constants';
import { ApigwStackTransform } from './provider-utils/awscloudformation/cdk-stack-builder';
import { getCfnApiArtifactHandler } from './provider-utils/awscloudformation/cfn-api-artifact-handler';
import { askAuthQuestions } from './provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import { authConfigToAppSyncAuthType } from './provider-utils/awscloudformation/utils/auth-config-to-app-sync-auth-type-bi-di-mapper';
import { checkAppsyncApiResourceMigration } from './provider-utils/awscloudformation/utils/check-appsync-api-migration';
import { getAppSyncApiResourceName } from './provider-utils/awscloudformation/utils/getAppSyncApiName';

export { NETWORK_STACK_LOGICAL_ID } from './category-constants';
export { addAdminQueriesApi, updateAdminQueriesApi } from './provider-utils/awscloudformation';
export { DEPLOYMENT_MECHANISM } from './provider-utils/awscloudformation/base-api-stack';
// eslint-disable-next-line spellcheck/spell-checker
export { convertDeperecatedRestApiPaths } from './provider-utils/awscloudformation/convert-deprecated-apigw-paths';
export { getContainers } from './provider-utils/awscloudformation/docker-compose';
export { EcsAlbStack } from './provider-utils/awscloudformation/ecs-alb-stack';
export { EcsStack } from './provider-utils/awscloudformation/ecs-apigw-stack';
export { promptToAddApiKey } from './provider-utils/awscloudformation/prompt-to-add-api-key';
export {
  ApiResource,
  generateContainersArtifacts,
  processDockerConfig,
} from './provider-utils/awscloudformation/utils/containers-artifacts';
export { getAuthConfig } from './provider-utils/awscloudformation/utils/get-appsync-auth-config';
export { getResolverConfig } from './provider-utils/awscloudformation/utils/get-appsync-resolver-config';
export { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';

const category = AmplifyCategories.API;
const categories = 'categories';

/**
 * Open the AppSync/API Gateway AWS console
 */
export const console = async (context: $TSContext): Promise<void> => {
  await run(context);
};

/**
 * Migrate from original API config
 */
export const migrate = async (context: $TSContext, serviceName?: string): Promise<void> => {
  const { projectPath } = context?.migrationInfo ?? { projectPath: pathManager.findProjectRoot() };
  const amplifyMeta = stateManager.getMeta(projectPath);
  const migrateResourcePromises = [];
  for (const categoryName of Object.keys(amplifyMeta)) {
    if (categoryName !== category) {
      // eslint-disable-next-line no-continue
      continue;
    }
    for (const resourceName of Object.keys(amplifyMeta[category])) {
      try {
        if (amplifyMeta[category][resourceName].providerPlugin) {
          // eslint-disable-next-line no-await-in-loop
          const providerController = await import(
            path.join(__dirname, 'provider-utils', amplifyMeta[category][resourceName].providerPlugin, 'index')
          );
          // eslint-disable-next-line max-depth
          if (!providerController) {
            // eslint-disable-next-line no-continue
            continue;
          }
          // eslint-disable-next-line max-depth
          if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
            migrateResourcePromises.push(
              providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName),
            );
          }
        } else {
          printer.error(`Provider not configured for ${category}: ${resourceName}`);
        }
      } catch (e) {
        printer.warn(`Could not run migration for ${category}: ${resourceName}`);
        throw e;
      }
    }
  }
  for (const migrateResourcePromise of migrateResourcePromises) {
    // eslint-disable-next-line no-await-in-loop
    await migrateResourcePromise;
  }
};

/**
 * Setup new environment with rds datasource
 */
export const initEnv = async (context: $TSContext): Promise<void> => {
  const datasource = 'Aurora Serverless';
  const service = 'service';
  const rdsInit = 'rdsInit';
  const rdsRegion = 'rdsRegion';
  const rdsClusterIdentifier = 'rdsClusterIdentifier';
  const rdsSecretStoreArn = 'rdsSecretStoreArn';
  const rdsDatabaseName = 'rdsDatabaseName';

  const { amplify } = context;

  /**
   * Check if we need to do the walkthrough, by looking to see if previous environments have
   * configured an RDS datasource
   */
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();

  // If this is a mobile hub migrated project without locally added resources then there is no
  // backend config exists yet.
  if (!fs.existsSync(backendConfigFilePath)) {
    return;
  }

  const backendConfig = stateManager.getBackendConfig();

  if (!backendConfig[category]) {
    return;
  }

  let resourceName;
  const apis = Object.keys(backendConfig[category]);
  for (const api of apis) {
    if (backendConfig[category][api][service] === AmplifySupportedService.APPSYNC) {
      resourceName = api;
      break;
    }
  }

  // If an AppSync API does not exist, no need to prompt for rds datasource
  if (!resourceName) {
    return;
  }

  // If an AppSync API has not been initialized with RDS, no need to prompt
  if (!backendConfig[category][resourceName][rdsInit]) {
    return;
  }

  const providerController = await import(path.join(__dirname, 'provider-utils', provider, 'index'));

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return;
  }

  /**
   * Check team provider info to ensure it hasn't already been created for current env
   */
  const currentEnv = amplify.getEnvInfo().envName;
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  if (
    teamProviderInfo[currentEnv][categories]
    && teamProviderInfo[currentEnv][categories][category]
    && teamProviderInfo[currentEnv][categories][category][resourceName]
    && teamProviderInfo[currentEnv][categories][category][resourceName]
    && teamProviderInfo[currentEnv][categories][category][resourceName][rdsRegion]
  ) {
    return;
  }

  // execute the walkthrough
  await providerController
    .addDatasource(context, category, datasource)
    .then(answers => {
      /**
       * Write the new answers to the team provider info
       */
      if (!teamProviderInfo[currentEnv][categories]) {
        teamProviderInfo[currentEnv][categories] = {};
      }
      if (!teamProviderInfo[currentEnv][categories][category]) {
        teamProviderInfo[currentEnv][categories][category] = {};
      }
      if (!teamProviderInfo[currentEnv][categories][category][resourceName]) {
        teamProviderInfo[currentEnv][categories][category][resourceName] = {};
      }

      teamProviderInfo[currentEnv][categories][category][resourceName][rdsRegion] = answers.region;
      teamProviderInfo[currentEnv][categories][category][resourceName][rdsClusterIdentifier] = answers.dbClusterArn;
      teamProviderInfo[currentEnv][categories][category][resourceName][rdsSecretStoreArn] = answers.secretStoreArn;
      teamProviderInfo[currentEnv][categories][category][resourceName][rdsDatabaseName] = answers.databaseName;

      stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
    })
    .then(() => {
      context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    });
};

/**
 * Get permissions for depending on this resource
 */
export const getPermissionPolicies = async (
  context: $TSContext,
  resourceOpsMapping: $TSObject,
): Promise<{ permissionPolicies: $TSAny[]; resourceAttributes: $TSAny[]; }> => {
  const amplifyMeta = stateManager.getMeta();
  const permissionPolicies = [];
  const resourceAttributes = [];

  await Promise.all(
    Object.keys(resourceOpsMapping).map(async resourceName => {
      try {
        const providerName = amplifyMeta[category][resourceName].providerPlugin;
        if (providerName) {
          const providerController = await import(path.join(__dirname, 'provider-utils', providerName, 'index'));
          const { policy, attributes } = await providerController.getPermissionPolicies(
            context,
            amplifyMeta[category][resourceName].service,
            resourceName,
            resourceOpsMapping[resourceName],
          );
          permissionPolicies.push(policy);
          resourceAttributes.push({ resourceName, attributes, category });
        } else {
          printer.error(`Provider not configured for ${category}: ${resourceName}`);
        }
      } catch (e) {
        printer.warn(`Could not get policies for ${category}: ${resourceName}`);
        throw e;
      }
    }),
  );
  return { permissionPolicies, resourceAttributes };
};

/**
 * Main entry point for executing an api subcommand
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<void> => {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = await import(commandPath);
  try {
    await commandModule.run(context);
  } catch (error) {
    if (error) {
      printer.error(error.message || error);
      if (error.stack) {
        printer.debug(error.stack);
      }
      await context.usageData.emitError(error);
    }
    process.exitCode = 1;
  }
};

/**
 * Main entry point for executing a headless api command
 */
export const executeAmplifyHeadlessCommand = async (context: $TSContext, headlessPayload: string): Promise<void> => {
  context.usageData.pushHeadlessFlow(headlessPayload, context.input);
  switch (context.input.command) {
    case 'add':
      await getCfnApiArtifactHandler(context).createArtifacts(await validateAddApiRequest(headlessPayload));
      break;
    case 'update': {
      const resourceName = await getAppSyncApiResourceName(context);
      await checkAppsyncApiResourceMigration(context, resourceName, true);
      await getCfnApiArtifactHandler(context).updateArtifacts(await validateUpdateApiRequest(headlessPayload));
      break;
    }
    default:
      printer.error(`Headless mode for ${context.input.command} api is not implemented yet`);
  }
};

/**
 * Not yet implemented
 */
export const handleAmplifyEvent = async (_: $TSContext, args): Promise<void> => {
  printer.info(`${category} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
};

/**
 * Add a new auth mode to the API
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const addGraphQLAuthorizationMode = async (context: $TSContext, args: $TSObject) => {
  const { authType, printLeadText, authSettings } = args;
  const meta = stateManager.getMeta();
  const apiName = getAppSyncResourceName(meta);
  if (!apiName) {
    return undefined;
  }

  const authConfig = getAppSyncAuthConfig(meta);
  const addAuthConfig = await askAuthQuestions(authType, context, printLeadText, authSettings);
  authConfig.additionalAuthenticationProviders.push(addAuthConfig);
  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, apiName, 'output', { authConfig });
  await context.amplify.updateBackendConfigAfterResourceUpdate(category, apiName, 'output', { authConfig });

  await getCfnApiArtifactHandler(context).updateArtifacts(
    {
      version: 1,
      serviceModification: {
        serviceName: 'AppSync',
        additionalAuthTypes: authConfig.additionalAuthenticationProviders.map(authConfigToAppSyncAuthType),
      },
    },
    {
      skipCompile: false,
    },
  );

  return addAuthConfig;
};

/**
 * Synthesize the CFN template for the API
 */
export const transformCategoryStack = async (context: $TSContext, resource: $TSObject): Promise<void> => {
  if (resource.service === AmplifySupportedService.APPSYNC) {
    if (canResourceBeTransformed(resource.resourceName)) {
      const backendDir = pathManager.getBackendDirPath();
      const overrideDir = path.join(backendDir, resource.category, resource.resourceName);
      const isBuild = await buildOverrideDir(backendDir, overrideDir).catch(error => {
        printer.error(`Build error : ${error.message}`);
        throw new Error(error);
      });
      await context.amplify.invokePluginMethod(context, 'awscloudformation', undefined, 'compileSchema', [
        context,
        {
          forceCompile: true,
          overrideConfig: {
            overrideFlag: isBuild,
            overrideDir,
            resourceName: resource.resourceName,
          },
        },
      ]);
    }
  } else if (resource.service === AmplifySupportedService.APIGW) {
    if (canResourceBeTransformed(resource.resourceName)) {
      // Rebuild CFN
      const apigwStack = new ApigwStackTransform(context, resource.resourceName);
      apigwStack.transform();
    }
  }
};

const canResourceBeTransformed = (
  resourceName: string,
): boolean => stateManager.resourceInputsJsonExists(undefined, AmplifyCategories.API, resourceName);
