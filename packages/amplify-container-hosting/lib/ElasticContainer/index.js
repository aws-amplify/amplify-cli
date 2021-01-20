// @ts-check
const { getS3Client, uploadFile } = require('./file-uploader');
const fs = require('fs-extra');
const inquirer = require('inquirer');
const path = require('path');

const constants = require('../constants');

const { EcsAlbStack, NETWORK_STACK_LOGICAL_ID, DEPLOYMENT_MECHANISM, processDockerConfig } = require('amplify-category-api');
const { open } = require('amplify-cli-core');

const serviceName = 'ElasticContainer';
const categoryName = 'hosting';
const resourceName = 'site';
const providerPlugin = 'awscloudformation';

const templateFileName = 'container-template.json';

async function enable(context) {
  context.print.info(
    'A registered domain is required. \nYou can register a domain using Route 53: https://aws.amazon.com/route53/ or use an existing domain.\n',
  );

  const { domain } = await inquirer.prompt({
    name: 'domain',
    message: 'Provide your web app endpoint (e.g. app.example.com or www.example.com):',
    type: 'input',
    validate: CheckIsValidDomain,
  });

  /** @type {AWS.Route53.HostedZone} */
  const domainZone = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'isDomainInZones', {
    domain,
  });

  const { Id: hostedZoneKey = '' } = domainZone || {};

  const [, hostedZoneId] = hostedZoneKey.match(/^\/hostedzone\/(.+)/) || [];

  const { restrictAccess } = await inquirer.prompt({
    name: 'restrictAccess',
    message: 'Do you want to automatically protect your web app using Amazon Cognito Hosted UI',
    type: 'confirm',
    default: false,
  });

  const meta = context.amplify.getProjectDetails().amplifyMeta;
  const hasAccessibleResources = ['storage', 'function'].some(categoryName => {
    return Object.keys(meta[categoryName] || {}).length > 0;
  });
  let rolePermissions = {};
  if (
    hasAccessibleResources &&
    (await context.amplify.confirmPrompt('Do you want to access other resources in this project from your container?'))
  ) {
    rolePermissions = await context.amplify.invokePluginMethod(context, 'function', undefined, 'askExecRolePermissionsQuestions', [
      context,
      resourceName,
      undefined,
      undefined,
      categoryName,
      serviceName,
    ]);
  }

  // Check if there are files inside source directory
  const { frontend } = context.amplify.getProjectConfig();
  const {
    config: { SourceDir: src },
  } = context.amplify.getProjectConfig()[frontend];
  const projectSrcDirPath = path.join(context.amplify.pathManager.getAmplifyDirPath(), '..', src);

  fs.ensureDirSync(projectSrcDirPath);

  if (!srcDirectoryHasDockerfileOrCompose(projectSrcDirPath)) {
    if (srcDirectoryOnlyHasAwsExportsFile(projectSrcDirPath)) {
      context.print.info(
        'No web application has been detected in your src directory. A sample web application with Dockerfile has been placed in the src directory for your convenience.',
      );

      fs.copySync(path.join(__dirname, '../../resources/express-template'), projectSrcDirPath, { recursive: true });
    } else {
      context.print.info(
        'Amplify detected existing web application files in your src directory. A sample Dockerfile has been placed in the src directory for you to use as a starting point when deploying to the cloud.',
      );

      fs.copySync(path.join(__dirname, '../../resources/simple-template'), projectSrcDirPath, { recursive: true });
    }
  }

  const { environmentMap, categoryPolicies, mutableParametersState, dependsOn } = rolePermissions;
  try {
    await generateHostingResources(
      context,
      { domain, hostedZoneId, restrictAccess, categoryPolicies, environmentMap, mutableParametersState, dependsOn },
      true,
    );
  } catch (err) {
    delete err.stack;
    throw err;
  }
}

function srcDirectoryOnlyHasAwsExportsFile(src) {
  const files = new Set(fs.readdirSync(src));

  return files.size === 1 && files.has('aws-exports.js');
}

function srcDirectoryHasDockerfileOrCompose(src) {
  const files = new Set(fs.readdirSync(src));

  return files.has('Dockerfile') || files.has('docker-compose.yaml') || files.has('docker-compose.yml');
}

export async function generateHostingResources(
  context,
  {
    domain,
    restrictAccess,
    hostedZoneId,
    exposedContainer: exposedContainerFromMeta = undefined,
    dependsOn: dependsOnFromRolePermissions = [],
    categoryPolicies = [],
    environmentMap = {},
    mutableParametersState = {},
  },
  addResource = false,
) {
  const dependsOn = [];

  let authName;
  let authDependensOn;
  if (restrictAccess) {
    const apiRequirements = { authSelections: 'identityPoolAndUserPool' };
    // getting requirement satisfaction map
    const satisfiedRequirements = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
      apiRequirements,
      context,
      'api',
      resourceName,
    ]);
    // checking to see if any requirements are unsatisfied
    const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

    if (foundUnmetRequirements) {
      try {
        authName = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
          context,
          'api',
          resourceName,
          apiRequirements,
        ]);
      } catch (e) {
        context.print.error(e);
        throw e;
      }
    } else {
      [authName] = Object.keys(context.amplify.getProjectDetails().amplifyMeta.auth);
    }

    // get auth dependency if exists to avoid duplication
    const authDependency = dependsOn.find(dependency => dependency.category === 'auth');

    if (authDependency === undefined) {
      authDependensOn = {
        category: 'auth',
        resourceName: authName,
        attributes: ['UserPoolId', 'AppClientIDWeb', 'HostedUIDomain'],
      };

      dependsOn.push(authDependensOn);
    } else {
      const existingAttributes = authDependency.attributes;

      const newAttributes = new Set([...existingAttributes, 'UserPoolId', 'AppClientIDWeb', 'HostedUIDomain']);

      authDependency.attributes = Array.from(newAttributes);
    }
  }

  const { auth: authDependsOnFromRolePermissions, rest: restDependsOnRolePermissions } = dependsOnFromRolePermissions.reduce(
    (/** @type {{auth: any, rest: any[]}} */ acc, dep) => {
      const { category, resourceName } = dep;
      if (category === 'auth' && resourceName === authName) {
        acc.auth = dep;
      } else {
        acc.rest.push(dep);
      }

      return acc;
    },
    { auth: undefined, rest: [] },
  );

  dependsOn.push(...restDependsOnRolePermissions);

  if (authDependensOn !== undefined) {
    const set = new Set(authDependensOn.attributes);

    if (authDependsOnFromRolePermissions) {
      authDependsOnFromRolePermissions.attributes.forEach(attribute => set.add(attribute));
    }

    authDependensOn.attributes = Array.from(set);
  }

  const {
    providers: { [constants.providerName]: provider },
  } = context.amplify.getProjectMeta();
  const { StackName: envName, DeploymentBucketName: deploymentBucketName } = provider;

  if (!dependsOn.find(({ resourceName }) => resourceName === NETWORK_STACK_LOGICAL_ID)) {
    dependsOn.push({
      category: '',
      resourceName: NETWORK_STACK_LOGICAL_ID,
      attributes: ['ClusterName', 'VpcId', 'VpcCidrBlock', 'SubnetIds', 'VpcLinkId', 'CloudMapNamespaceId'],
    });
  }

  const { frontend } = context.amplify.getProjectConfig();
  const {
    config: { SourceDir: src },
  } = context.amplify.getProjectConfig()[frontend];

  const { projectPath } = context.amplify.getEnvInfo();
  const srcPath = path.join(projectPath, src);

  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();

  /** @type {import('amplify-category-api').ApiResource & {service: string, domain: string, providerPlugin:string, hostedZoneId: string, iamAccessUnavailable: boolean}} */
  const resource = {
    resourceName,
    service: serviceName,
    providerPlugin,
    domain,
    authName,
    restrictAccess,
    // apiType: undefined,
    category: categoryName,
    categoryPolicies,
    dependsOn,
    deploymentMechanism: DEPLOYMENT_MECHANISM.FULLY_MANAGED,
    environmentMap,
    mutableParametersState,
    exposedContainer: exposedContainerFromMeta,
    // gitHubInfo,
    output: {}, // TODO next ime?
    hostedZoneId,
    iamAccessUnavailable: true,
  };

  const { containers, containersPorts, desiredCount, exposedContainer, isInitialDeploy, secretsArns } = await processDockerConfig(
    context,
    resource,
    srcPath,
  );

  resource.exposedContainer = exposedContainer;

  /** @type {AWS.ECR.RepositoryList} */
  const repositories = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'describeEcrRepositories');

  const existingEcrRepositories = new Set(
    repositories
      .map(({ repositoryName }) => repositoryName)
      .filter(repositoryName => repositoryName.startsWith(`${envName}-${categoryName}-${resourceName}-`)),
  );

  const stack = new EcsAlbStack(undefined, 'ContainersHosting', {
    envName,
    categoryName,
    apiName: resourceName,
    authName,
    dependsOn,
    policies: [], // TODO
    deploymentBucketName,
    restrictAccess,
    createCloudMapService: false,
    secretsArns,
    isInitialDeploy,
    deploymentMechanism: resource.deploymentMechanism,
    domainName: resource.domain,
    desiredCount,
    hostedZoneId,
    containers,
    exposedContainer,
    taskPorts: containersPorts,
    gitHubSourceActionInfo: undefined,
    taskEnvironmentVariables: {}, // TODO
    existingEcrRepositories,
  });

  context.exeInfo.template = stack.toCloudFormation();

  const resourceDirPath = path.join(projectBackendDirPath, constants.CategoryName, serviceName);
  fs.ensureDirSync(resourceDirPath);

  const templateFilePath = path.join(resourceDirPath, templateFileName);
  let jsonString = JSON.stringify(context.exeInfo.template, null, 4);
  fs.writeFileSync(templateFilePath, jsonString, 'utf8');

  if (addResource) {
    return context.amplify.updateamplifyMetaAfterResourceAdd(constants.CategoryName, serviceName, resource);
  } else {
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'restrictAccess', restrictAccess);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'hostedZoneId', hostedZoneId);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'exposedContainer', exposedContainer);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'environmentMap', environmentMap);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(
      constants.CategoryName,
      serviceName,
      'mutableParametersState',
      mutableParametersState,
    );
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'dependsOn', dependsOn);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(constants.CategoryName, serviceName, 'categoryPolicies', categoryPolicies);
  }
}

function CheckIsValidDomain(domain) {
  var re = new RegExp(/^(\*\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\.)+((?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9])$/);
  const validDomain = re.test(domain);

  return validDomain || `Domain ${domain} invalid`;
}

async function configure(context) {
  const {
    hosting: {
      ElasticContainer: {
        domain: currentDomain,
        restrictAccess: currentRestrictAccess,
        mutableParametersState: currentMutableParameterState,
        environmentMap: currentEnvironmentMap,
      },
    },
  } = context.amplify.getProjectMeta();

  context.print.info(
    'A registered domain is required. \nYou can register a domain using Route 53: aws.amazon.com/route53/ or use an existing domain.\n',
  );

  const { domain } = await inquirer.prompt({
    name: 'domain',
    message: 'Provide your web app endpoint (e.g. app.example.com or www.example.com):',
    type: 'input',
    validate: CheckIsValidDomain,
    default: currentDomain,
  });

  /** @type {AWS.Route53.HostedZone} */
  const domainZone = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'isDomainInZones', {
    domain,
  });

  const { Id: hostedZoneKey = '' } = domainZone || {};

  const [, hostedZoneId] = hostedZoneKey.match(/^\/hostedzone\/(.+)/) || [];

  const { restrictAccess } = await inquirer.prompt({
    name: 'restrictAccess',
    message: 'Do you want to automatically protect your web app using Amazon Cognito Hosted UI',
    type: 'confirm',
    default: currentRestrictAccess,
  });

  const meta = context.amplify.getProjectDetails().amplifyMeta;
  const hasAccessibleResources = ['storage', 'function'].some(categoryName => {
    return Object.keys(meta[categoryName] || {}).length > 0;
  });
  let rolePermissions = {};
  if (
    hasAccessibleResources &&
    (await context.amplify.confirmPrompt('Do you want to access other resources in this project from your container?'))
  ) {
    rolePermissions = await context.amplify.invokePluginMethod(context, 'function', undefined, 'askExecRolePermissionsQuestions', [
      context,
      resourceName,
      currentMutableParameterState.permissions,
      currentEnvironmentMap,
      categoryName,
      serviceName,
    ]);
  }

  const { environmentMap, categoryPolicies, mutableParametersState, dependsOn } = rolePermissions;
  try {
    await generateHostingResources(
      context,
      { domain, hostedZoneId, restrictAccess, categoryPolicies, environmentMap, mutableParametersState, dependsOn },
      false,
    );
  } catch (err) {
    delete err.stack;
    throw err;
  }
}

async function publish(context, args) {
  const { frontend } = context.amplify.getProjectConfig();
  const {
    config: { SourceDir: src, DistributionDir: dst },
  } = context.amplify.getProjectConfig()[frontend];

  const { projectPath } = context.amplify.getEnvInfo();
  const srcPath = path.join(projectPath, src);
  const fileName = 'site.zip';
  const filePath = path.join(dst, fileName);

  await context.amplify.executeProviderUtils(context, 'awscloudformation', 'zipFiles', [srcPath, filePath]);

  const {
    providers: { [constants.providerName]: provider },
  } = context.amplify.getProjectMeta();
  const { DeploymentBucketName: deploymentBucketName } = provider;

  const s3Client = await getS3Client(context, 'publish');
  await uploadFile(s3Client, deploymentBucketName, filePath, fileName);

  const {
    hosting: {
      ElasticContainer: {
        output: { PipelineUrl },
      },
    },
  } = context.amplify.getProjectMeta();

  context.print.info(`\nPublish started, you can check the status of the deployment on:\n${PipelineUrl}`);
}

async function console(context) {
  // Check this behavior
  const amplifyMeta = context.amplify.getProjectMeta();
  const { Region } = amplifyMeta.providers[providerPlugin];

  const { PipelineName, ServiceName, ClusterName } = amplifyMeta[constants.CategoryName][serviceName].output;
  const codePipeline = 'CodePipeline';
  const elasticContainer = 'ElasticContainer';
  let url;

  const { selectedConsole } = await inquirer.prompt({
    name: 'selectedConsole',
    message: 'Which console you want to open',
    type: 'list',
    choices: [
      {
        name: 'Elastic Container Service (Deployed container status)',
        value: elasticContainer,
      },
      {
        name: 'CodePipeline (Container build status)',
        value: codePipeline,
      },
    ],
  });

  if (selectedConsole === elasticContainer) {
    url = `https://console.aws.amazon.com/ecs/home?region=${Region}#/clusters/${ClusterName}/services/${ServiceName}/details`;
  } else if (selectedConsole === codePipeline) {
    url = `https://${Region}.console.aws.amazon.com/codesuite/codepipeline/pipelines/${PipelineName}/view`;
  } else {
    context.print.error('Option not available');
    return;
  }
  open(url, { wait: false });
}

async function migrate(context) {}

module.exports = {
  enable,
  configure,
  publish,
  console,
  migrate,
  generateHostingResources,
};
