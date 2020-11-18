import * as iam from '@aws-cdk/aws-iam';
import { Octokit } from '@octokit/rest';
import { validateAddApiRequest, validateUpdateApiRequest } from 'amplify-util-headless-input';
import fs from 'fs-extra';
import path from 'path';
import { run } from './commands/api/console';
import { provider as cloudformationProviderName } from './provider-utils/awscloudformation/aws-constants';
import { getCfnApiArtifactHandler } from './provider-utils/awscloudformation/cfn-api-artifact-handler';
import { getContainers } from './provider-utils/awscloudformation/docker-compose';
import { DEPLOYMENT_MECHANISM, EcsStack } from './provider-utils/awscloudformation/ecs-stack';
import { ResourceDependency } from './provider-utils/awscloudformation/service-walkthroughs/containers-walkthrough';
import { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';

export { EcsStack } from './provider-utils/awscloudformation/ecs-stack';
export { getGitHubOwnerRepoFromPath } from './provider-utils/awscloudformation/utils/github';

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

export type ApiResource = {
  category: string;
  resourceName: string;
  githubInfo?: {
    path: string;
    tokenSecretArn: string;
  };
  deploymentMechanism: DEPLOYMENT_MECHANISM;
  authName: string;
  restrictAccess: boolean;
  lastPushTimeStamp: string;
  dependsOn: ResourceDependency[];
  environmentMap: Record<string, string>;
  categoryPolicies: any[];
  mutableParametersState: any;
  output?: Record<string, any>;
};

export async function generateContainersArtifacts(context: any, resource: ApiResource) {
  const {
    category: categoryName,
    resourceName,
    githubInfo,
    deploymentMechanism,
    output,
    categoryPolicies = [],
    dependsOn,
    environmentMap,
    restrictAccess,
  } = resource;

  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, categoryName, resourceName));

  const {
    providers: { [cloudformationProviderName]: provider },
  } = context.amplify.getProjectMeta();

  const { StackName: envName, DeploymentBucketName: deploymentBucket } = provider;

  const srcPath = path.join(resourceDir, 'src');

  const dockerComposeFilename = 'docker-compose.yml';
  const dockerfileFilename = 'Dockerfile';

  const containerDefinitionFileNames = [dockerComposeFilename, dockerfileFilename];

  const containerDefinitionFiles: Record<string, string> = {};

  for await (const fileName of containerDefinitionFileNames) {
    switch (deploymentMechanism) {
      case DEPLOYMENT_MECHANISM.FULLY_MANAGED:
      case DEPLOYMENT_MECHANISM.SELF_MANAGED:
        const filePath = path.normalize(path.join(srcPath, fileName));

        if (fs.existsSync(filePath)) {
          containerDefinitionFiles[fileName] = fs.readFileSync(filePath).toString();
        }
        break;
      case DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED:
        const { path: repoUri, tokenSecretArn } = githubInfo;

        const { SecretString: githubToken } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'retrieveSecret', {
          secretArn: tokenSecretArn,
        });

        const octokit = new Octokit({ auth: githubToken });

        const { owner, repo, branch, path: pathInRepo } = getGitHubOwnerRepoFromPath(repoUri);

        try {
          const {
            data: { content, encoding },
          } = await octokit.repos.getContent({
            owner,
            repo,
            ...(branch ? { ref: branch } : undefined), // only include branch if not undefined
            path: path.join(pathInRepo, fileName),
          });

          containerDefinitionFiles[fileName] = Buffer.from(content, encoding).toString('utf8');
        } catch (error) {
          const { status } = error;

          // It is ok if the file doesn't exist, we skip it
          if (status !== 404) {
            throw error;
          }
        }
        break;
      default: {
        (function exhaustiveCheck(obj: never) {
          throw new Error(`Invalid deploymentMechanism: ${obj}`);
        })(deploymentMechanism);
      }
    }
  }

  const noDefinitionAvailable = Object.keys(containerDefinitionFiles).length === 0;

  if (noDefinitionAvailable) {
    throw new Error('No definition available (docker-compose.yaml / Dockerfile)');
  }

  let composeContents = containerDefinitionFiles[dockerComposeFilename];
  const { [dockerfileFilename]: dockerfileContents } = containerDefinitionFiles;

  const { buildspec, containers, service } = getContainers(composeContents, dockerfileContents);

  const containersPorts = containers.reduce(
    (acc, container) =>
      [].concat(
        acc,
        container.portMappings.map(({ containerPort }) => containerPort),
      ),
    [],
  );

  if (containersPorts.length === 0) {
    throw new Error('Service requires at least one exposed port');
  }

  fs.ensureDirSync(srcPath);
  fs.writeFileSync(path.join(srcPath, 'buildspec.yml'), buildspec);

  const desiredCount = service?.replicas ?? 1; // TODO: 1 should be from meta (HA setting)
  const isInitialDeploy = Object.keys(output ?? {}).length === 0;

  const stack = new EcsStack(undefined, 'ContainersStack', {
    envName,
    categoryName,
    apiName: resourceName,
    taskPorts: containersPorts,
    dependsOn,
    policies: wrapJsonPoliciesInCdkPolicies(categoryPolicies),
    taskEnvironmentVariables: environmentMap,
    githubSourceActionInfo: githubInfo,
    deploymentMechanism,
    deploymentBucket,
    containers,
    isInitialDeploy,
    desiredCount,
    restrictAccess
  });

  const cfn = stack.toCloudFormation();

  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  context.amplify.writeObjectAsJson(path.normalize(path.join(resourceDir, cfnFileName)), cfn, true);
}

/**
 * Wraps an array of JSON IAM statements in a {iam.PolicyStatement} array.
 * This allow us tu pass the statements in a way that CDK can use when synthesizing
 *
 * CDK looks for a toStatementJson function
 *
 * @param policies JSON object with IAM statements
 * @returns {iam.PolicyStatement} CDK compatible policy statement
 */
function wrapJsonPoliciesInCdkPolicies(policies: Record<string, any>[] = []): iam.PolicyStatement[] {
  return policies.map(statement => {
    return {
      toStatementJson() {
        return statement;
      },
    } as iam.PolicyStatement;
  });
}
