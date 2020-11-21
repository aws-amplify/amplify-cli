import * as iam from '@aws-cdk/aws-iam';
import { Octokit } from '@octokit/rest';
import * as fs from 'fs-extra';
import inquirer from 'inquirer';
import * as path from 'path';
import uuid from 'uuid';
import { provider as cloudformationProviderName } from '../../../provider-utils/awscloudformation/aws-constants';
import { getContainers } from '../../../provider-utils/awscloudformation/docker-compose';
import Container from '../../../provider-utils/awscloudformation/docker-compose/ecs-objects/Container';
import { DEPLOYMENT_MECHANISM, EcsStack } from '../../../provider-utils/awscloudformation/ecs-stack';
import { API_TYPE, ResourceDependency } from '../../../provider-utils/awscloudformation/service-walkthroughs/containers-walkthrough';
import { getGitHubOwnerRepoFromPath } from '../../../provider-utils/awscloudformation/utils/github';
import { JSONUtilities } from 'amplify-cli-core';

export type ApiResource = {
  category: string;
  resourceName: string;
  gitHubInfo?: {
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
  apiType: API_TYPE;
  exposedContainer?: { name: string; port: number };
};

type ExposedContainer = {
  name: string;
  port: number;
};

type ContainerArtifactsMetadata = {
  exposedContainer: ExposedContainer;
  pipelineInfo: { consoleUrl: string };
};

export async function generateContainersArtifacts(context: any, resource: ApiResource): Promise<ContainerArtifactsMetadata> {
  const {
    category: categoryName,
    resourceName,
    gitHubInfo,
    deploymentMechanism,
    output,
    categoryPolicies = [],
    dependsOn,
    environmentMap,
    restrictAccess,
    apiType,
    exposedContainer: exposedContainerFromMeta,
  } = resource;

  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backendDir, categoryName, resourceName));

  const {
    providers: { [cloudformationProviderName]: provider },
  } = context.amplify.getProjectMeta();

  const { StackName: envName, DeploymentBucketName: deploymentBucket } = provider;

  const srcPath = path.join(resourceDir, 'src');

  const dockerComposeFileNameYaml = 'docker-compose.yaml';
  const dockerComposeFileNameYml = 'docker-compose.yml';
  const dockerfileFileName = 'Dockerfile';

  const containerDefinitionFileNames = [dockerComposeFileNameYaml, dockerComposeFileNameYml, dockerfileFileName];

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
        const { path: repoUri, tokenSecretArn } = gitHubInfo;

        const { SecretString: gitHubToken } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'retrieveSecret', {
          secretArn: tokenSecretArn,
        });

        const octokit = new Octokit({ auth: gitHubToken });

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
        const exhaustiveCheck: never = deploymentMechanism;
        throw new Error(`Unhandled type [${exhaustiveCheck}]`);
      }
    }
  }

  if (Object.keys(containerDefinitionFiles).length === 0) {
    throw new Error('No definition available (docker-compose.yaml / docker-compose.yml / Dockerfile)');
  }

  if (containerDefinitionFiles[dockerComposeFileNameYaml] && containerDefinitionFiles[dockerComposeFileNameYml]) {
    throw new Error('There should be only one docker-compose.yaml / docker-compose.yml)');
  }

  const composeContents = containerDefinitionFiles[dockerComposeFileNameYaml] || containerDefinitionFiles[dockerComposeFileNameYml];
  const { [dockerfileFileName]: dockerfileContents } = containerDefinitionFiles;

  const { buildspec, containers, service, secrets } = getContainers(composeContents, dockerfileContents);

  const containersPorts = containers.reduce(
    (acc, container) =>
      [].concat(
        acc,
        container.portMappings.map(({ containerPort }) => containerPort),
      ),
    [],
  );

  const newContainersName = Array.from(new Set(containers.map(({ name }) => name)));

  let isInitialDeploy = Object.keys(output ?? {}).length === 0;
  const currentContainersSet = new Set(output?.ContainerNames?.split(','));
  // Service require all containers to exists
  isInitialDeploy = isInitialDeploy ||
    newContainersName.some(newContainer => !currentContainersSet.has(newContainer));

  let exposedContainer: { name: string; port: number };

  const containersExposed = containers.filter(container => container.portMappings.length > 0);

  if (containersPorts.length === 0) {
    throw new Error('Service requires at least one exposed port');
  } else if (containersPorts.length > 1) {
    exposedContainer = await checkContainerExposed(containersExposed, exposedContainerFromMeta);
  } else {
    exposedContainer = {
      name: containersExposed[0].name,
      port: containersExposed[0].portMappings[0].containerPort,
    };
  }

  fs.ensureDirSync(srcPath);
  fs.writeFileSync(path.join(srcPath, 'buildspec.yml'), buildspec);

  const secretsArns: Map<string, string> = new Map<string, string>();

  if ((await shouldUpdateSecrets(context, secrets)) || isInitialDeploy) {
    // Normalizes paths
    // Validate secrets file paths, existence and prefixes
    const errors = Object.entries(secrets).reduce((acc, [secretName, secretFilePath]) => {
      const baseDir = path.isAbsolute(secretFilePath) ? '' : srcPath;
      const normalizedFilePath = path.normalize(path.join(baseDir, secretFilePath));

      secrets[secretName] = normalizedFilePath;

      let canRead = true;

      try {
        const fd = fs.openSync(normalizedFilePath, 'r');

        fs.closeSync(fd);
      } catch (err) {
        canRead = false;
      }

      if (!canRead) {
        acc.push(`Secret file "${secretFilePath}" can't be read.`);
        return acc;
      }

      const basename = path.basename(normalizedFilePath);
      const hasCorrectPrefix = basename.startsWith('.secret-');

      if (!hasCorrectPrefix) {
        acc.push(`Secret file "${secretFilePath}" doesn't start with the ".secret-" prefix.`);
        return acc;
      }

      const isInsideSrc = normalizedFilePath.startsWith(path.join(srcPath, path.sep));
      if (isInsideSrc) {
        acc.push(`Secret file "${secretFilePath}" should not be inside the "src" folder. The "src" folder will be uploaded to S3.`);
        return acc;
      }

      return acc;
    }, <string[]>[]);

    if (errors.length > 0) {
      throw new Error(['Error(s) in secret file(s):'].concat(errors).join('\n'));
    }

    for await (const entries of Object.entries(secrets)) {
      const [secretName, secretFilePath] = entries;

      const contents = fs.readFileSync(secretFilePath).toString();

      const ssmSecretName = `${envName}-${resourceName}-${secretName}`;

      const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'upsertSecretValue', {
        secret: contents,
        description: `Secret for ${resourceName}`,
        name: ssmSecretName,
        version: uuid(),
      });

      secretsArns.set(secretName, secretArn);
    }
  }

  const desiredCount = service?.replicas ?? 1; // TODO: 1 should be from meta (HA setting)

  const stack = new EcsStack(undefined, 'ContainersStack', {
    envName,
    categoryName,
    apiName: resourceName,
    taskPorts: containersPorts,
    dependsOn,
    policies: wrapJsonPoliciesInCdkPolicies(categoryPolicies),
    taskEnvironmentVariables: environmentMap,
    gitHubSourceActionInfo: gitHubInfo,
    deploymentMechanism,
    deploymentBucket,
    containers,
    isInitialDeploy,
    desiredCount,
    restrictAccess,
    apiType,
    exposedContainer,
    secretsArns,
  });

  const cfn = stack.toCloudFormation();

  const cfnFileName = `${resourceName}-cloudformation-template.json`;
  JSONUtilities.writeJson(path.normalize(path.join(resourceDir, cfnFileName)), cfn);

  return {
    exposedContainer,
    pipelineInfo: { consoleUrl: stack.getPipelineConsoleUrl(provider.Region) },
  };
}

async function shouldUpdateSecrets(context: any, secrets: Record<string, string>): Promise<boolean> {
  const hasSecrets = Object.keys(secrets).length > 0;

  if (!hasSecrets || context.exeInfo.inputParams.yes) {
    return false;
  }

  const { update_secrets } = await inquirer.prompt({
    name: 'update_secrets',
    type: 'confirm',
    message: 'Secret configuration detected. Do you wish to store new values in the cloud?',
    default: false,
  });

  return update_secrets;
}

async function checkContainerExposed(
  containersExposed: Container[],
  exposedContainerFromMeta: { name: string; port: number } = { name: '', port: 0 },
): Promise<{ name: string; port: number }> {
  const containerExposed = containersExposed.find(container => container.name === exposedContainerFromMeta.name);

  if (containerExposed?.portMappings.find(port => port.containerPort === exposedContainerFromMeta.port)) {
    return { ...exposedContainerFromMeta };
  } else {
    const choices: { name: string; value: Container }[] = containersExposed.map(container => ({ name: container.name, value: container }));

    const { containerToExpose } = await inquirer.prompt({
      name: 'containerToExpose',
      type: 'list',
      choices,
    });

    return {
      name: containerToExpose.name,
      port: containerToExpose.portMappings[0].containerPort,
    };
  }
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
