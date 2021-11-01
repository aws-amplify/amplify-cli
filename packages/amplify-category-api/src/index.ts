import {
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
import { getAppSyncAuthConfig, getAppSyncResourceName } from './provider-utils/awscloudformation//utils/amplify-meta-utils';
import { provider } from './provider-utils/awscloudformation/aws-constants';
import { ApigwStackTransform } from './provider-utils/awscloudformation/cdk-stack-builder';
import { getCfnApiArtifactHandler } from './provider-utils/awscloudformation/cfn-api-artifact-handler';
import { askAuthQuestions } from './provider-utils/awscloudformation/service-walkthroughs/appSync-walkthrough';
import { authConfigToAppSyncAuthType } from './provider-utils/awscloudformation/utils/auth-config-to-app-sync-auth-type-bi-di-mapper';

export { NETWORK_STACK_LOGICAL_ID } from './category-constants';
export { addAdminQueriesApi, updateAdminQueriesApi } from './provider-utils/awscloudformation/';
export { DEPLOYMENT_MECHANISM } from './provider-utils/awscloudformation/base-api-stack';
export { getContainers } from './provider-utils/awscloudformation/docker-compose';
export { EcsAlbStack } from './provider-utils/awscloudformation/ecs-alb-stack';
export { EcsStack } from './provider-utils/awscloudformation/ecs-apigw-stack';
export { promptToAddApiKey } from './provider-utils/awscloudformation/prompt-to-add-api-key';
export {
  ApiResource,
  generateContainersArtifacts,
  processDockerConfig,
} from './provider-utils/awscloudformation/utils/containers-artifacts';
export { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';

const category = AmplifyCategories.API;
const categories = 'categories';

export async function console(context: $TSContext) {
  await run(context);
}

export async function migrate(context: $TSContext, serviceName?: string) {
  const { projectPath } = context.migrationInfo;
  const amplifyMeta = stateManager.getMeta();
  const migrateResourcePromises = [];
  for (const categoryName of Object.keys(amplifyMeta)) {
    if (categoryName === category) {
      for (const resourceName of Object.keys(amplifyMeta[category])) {
        try {
          if (amplifyMeta[category][resourceName].providerPlugin) {
            const providerController = await import(
              path.join('.', 'provider-utils', amplifyMeta[category][resourceName].providerPlugin, 'index')
            );
            if (providerController) {
              if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
                migrateResourcePromises.push(
                  providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName),
                );
              }
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
  }

  await Promise.all(migrateResourcePromises);
}

export async function initEnv(context: $TSContext) {
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

  const providerController = await import(path.join('.', 'provider-utils', provider, 'index'));

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return;
  }

  /**
   * Check team provider info to ensure it hasn't already been created for current env
   */
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfo = stateManager.getTeamProviderInfo();
  if (
    teamProviderInfo[currEnv][categories] &&
    teamProviderInfo[currEnv][categories][category] &&
    teamProviderInfo[currEnv][categories][category][resourceName] &&
    teamProviderInfo[currEnv][categories][category][resourceName] &&
    teamProviderInfo[currEnv][categories][category][resourceName][rdsRegion]
  ) {
    return;
  }

  /**
   * Execute the walkthrough
   */
  return providerController
    .addDatasource(context, category, datasource)
    .then(answers => {
      /**
       * Write the new answers to the team provider info
       */
      if (!teamProviderInfo[currEnv][categories]) {
        teamProviderInfo[currEnv][categories] = {};
      }
      if (!teamProviderInfo[currEnv][categories][category]) {
        teamProviderInfo[currEnv][categories][category] = {};
      }
      if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
        teamProviderInfo[currEnv][categories][category][resourceName] = {};
      }

      teamProviderInfo[currEnv][categories][category][resourceName][rdsRegion] = answers.region;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsClusterIdentifier] = answers.dbClusterArn;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsSecretStoreArn] = answers.secretStoreArn;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsDatabaseName] = answers.databaseName;

      stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
    })
    .then(() => {
      context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    });
}

export async function getPermissionPolicies(context: $TSContext, resourceOpsMapping: $TSObject) {
  const amplifyMeta = stateManager.getMeta();
  const permissionPolicies = [];
  const resourceAttributes = [];

  await Promise.all(
    Object.keys(resourceOpsMapping).map(async resourceName => {
      try {
        const providerName = amplifyMeta[category][resourceName].providerPlugin;
        if (providerName) {
          const providerController = await import(path.join('.', 'provider-utils', providerName, 'index'));
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
}

export async function executeAmplifyCommand(context: $TSContext) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = await import(commandPath);
  await commandModule.run(context);
}

export const executeAmplifyHeadlessCommand = async (context: $TSContext, headlessPayload: string) => {
  switch (context.input.command) {
    case 'add':
      await getCfnApiArtifactHandler(context).createArtifacts(await validateAddApiRequest(headlessPayload));
      break;
    case 'update':
      await getCfnApiArtifactHandler(context).updateArtifacts(await validateUpdateApiRequest(headlessPayload));
      break;
    default:
      printer.error(`Headless mode for ${context.input.command} api is not implemented yet`);
  }
};

export async function handleAmplifyEvent(context: $TSContext, args) {
  printer.info(`${category} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

export async function addGraphQLAuthorizationMode(context: $TSContext, args: $TSObject) {
  const { authType, printLeadText, authSettings } = args;
  const meta = stateManager.getMeta();
  const apiName = getAppSyncResourceName(meta);
  if (!apiName) {
    return;
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
}

export async function transformCategoryStack(context: $TSContext, resource: $TSObject) {
  if (resource.service === AmplifySupportedService.APIGW) {
    if (canResourceBeTransformed(resource.resourceName)) {
      const backendDir = pathManager.getBackendDirPath();
      const overrideDir = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, resource.resourceName);
      await buildOverrideDir(backendDir, overrideDir).catch(error => {
        printer.debug(`Skipping build as ${error.message}`);
        return false;
      });
      // Rebuild CFN
      const apigwStack = new ApigwStackTransform(context, resource.resourceName);
      apigwStack.transform();
    }
  }
}

function canResourceBeTransformed(resourceName: string) {
  return stateManager.resourceInputsJsonExists(undefined, AmplifyCategories.API, resourceName);
}
