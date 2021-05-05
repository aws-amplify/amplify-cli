import { validateAddApiRequest, validateUpdateApiRequest } from 'amplify-util-headless-input';
import fs from 'fs-extra';
import path from 'path';
import { run } from './commands/api/console';
import { getCfnApiArtifactHandler } from './provider-utils/awscloudformation/cfn-api-artifact-handler';

export { NETWORK_STACK_LOGICAL_ID } from './category-constants';
export { DEPLOYMENT_MECHANISM } from './provider-utils/awscloudformation/base-api-stack';
export { EcsStack } from './provider-utils/awscloudformation/ecs-apigw-stack';
export { EcsAlbStack } from './provider-utils/awscloudformation/ecs-alb-stack';
export { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';
export {
  generateContainersArtifacts,
  ApiResource,
  processDockerConfig,
} from './provider-utils/awscloudformation/utils/containers-artifacts';
export { getContainers } from './provider-utils/awscloudformation/docker-compose';

const category = 'api';

const categories = 'categories';

export async function console(context) {
  await run(context);
}

export async function migrate(context, serviceName) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach(categoryName => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        try {
          if (amplifyMeta[category][resourceName].providerPlugin) {
            const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
            if (providerController) {
              if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
                migrateResourcePromises.push(
                  providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName),
                );
              }
            }
          } else {
            context.print.error(`Provider not configured for ${category}: ${resourceName}`);
          }
        } catch (e) {
          context.print.warning(`Could not run migration for ${category}: ${resourceName}`);
          throw e;
        }
      });
    }
  });

  await Promise.all(migrateResourcePromises);
}

export async function initEnv(context) {
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
  const backendConfigFilePath = amplify.pathManager.getBackendConfigFilePath();

  // If this is a mobile hub migrated project without locally added resources then there is no
  // backend config exists yet.
  if (!fs.existsSync(backendConfigFilePath)) {
    return;
  }

  const backendConfig = amplify.readJsonFile(backendConfigFilePath);

  if (!backendConfig[category]) {
    return;
  }

  let resourceName;
  const apis = Object.keys(backendConfig[category]);
  for (let i = 0; i < apis.length; i += 1) {
    if (backendConfig[category][apis[i]][service] === 'AppSync') {
      resourceName = apis[i];
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

  const providerController = require('./provider-utils/awscloudformation/index');

  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }

  /**
   * Check team provider info to ensure it hasn't already been created for current env
   */
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
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

      fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));
    })
    .then(() => {
      context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { forceCompile: true });
    });
}

export async function getPermissionPolicies(context, resourceOpsMapping) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies = [];
  const resourceAttributes = [];

  await Promise.all(
    Object.keys(resourceOpsMapping).map(async resourceName => {
      try {
        const providerName = amplifyMeta[category][resourceName].providerPlugin;
        if (providerName) {
          const providerController = require(`./provider-utils/${providerName}/index`);
          const { policy, attributes } = await providerController.getPermissionPolicies(
            context,
            amplifyMeta[category][resourceName].service,
            resourceName,
            resourceOpsMapping[resourceName],
          );
          permissionPolicies.push(policy);
          resourceAttributes.push({ resourceName, attributes, category });
        } else {
          context.print.error(`Provider not configured for ${category}: ${resourceName}`);
        }
      } catch (e) {
        context.print.warning(`Could not get policies for ${category}: ${resourceName}`);
        throw e;
      }
    }),
  );
  return { permissionPolicies, resourceAttributes };
}

export async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export const executeAmplifyHeadlessCommand = async (context, headlessPayload: string) => {
  switch (context.input.command) {
    case 'add':
      await getCfnApiArtifactHandler(context).createArtifacts(await validateAddApiRequest(headlessPayload));
      break;
    case 'update':
      await getCfnApiArtifactHandler(context).updateArtifacts(await validateUpdateApiRequest(headlessPayload));
      break;
    default:
      context.print.error(`Headless mode for ${context.input.command} api is not implemented yet`);
  }
};

export async function handleAmplifyEvent(context, args) {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}
