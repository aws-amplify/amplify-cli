import fs from 'fs-extra';
import path from 'path';
import uuid from 'uuid';
import { NETWORK_STACK_LOGICAL_ID } from '../../category-constants';
import { DEPLOYMENT_MECHANISM } from './base-api-stack';
import { GitHubSourceActionInfo } from './pipeline-with-awaiter';
import { API_TYPE, IMAGE_SOURCE_TYPE, ResourceDependency, ServiceConfiguration } from './service-walkthroughs/containers-walkthrough';
import { ApiResource, generateContainersArtifacts } from './utils/containers-artifacts';
import { createDefaultCustomPoliciesFile, pathManager } from 'amplify-cli-core';

export const addResource = async (
  serviceWalkthroughPromise: Promise<ServiceConfiguration>,
  context,
  category,
  service,
  options,
  apiType: API_TYPE,
) => {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const walkthroughOptions = await serviceWalkthroughPromise;

  const {
    resourceName,
    restrictAccess,
    imageSource,
    gitHubPath,
    gitHubToken,
    deploymentMechanism,
    categoryPolicies,
    environmentMap,
    dependsOn = [],
    mutableParametersState,
  } = walkthroughOptions;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

  let [authName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });

  let gitHubInfo: GitHubSourceActionInfo;

  if (deploymentMechanism === DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
    const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];

    const secretName = `${StackName}-${category}-${resourceName}-github-token`;
    const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'newSecret', {
      secret: gitHubToken,
      description: 'GitHub OAuth token',
      name: secretName,
      version: secretName,
    });

    const gitHubTokenSecretArn = secretArn;

    gitHubInfo = {
      path: gitHubPath,
      tokenSecretArn: gitHubTokenSecretArn,
    };
  }

  const build = deploymentMechanism === DEPLOYMENT_MECHANISM.FULLY_MANAGED;

  options = {
    resourceName,
    dependsOn: updatedDependsOn,
    deploymentMechanism,
    imageSource,
    restrictAccess,
    build,
    providerPlugin: 'awscloudformation',
    service: 'ElasticContainer',
    gitHubInfo,
    authName,
    environmentMap,
    categoryPolicies,
    mutableParametersState,
    skipHashing: false,
    apiType,
    iamAccessUnavailable: true, // this is because we dont support IAM access to the API yet
  };

  await context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

  const apiResource = (await context.amplify.getProjectMeta().api[resourceName]) as ApiResource;
  apiResource.category = category;

  fs.ensureDirSync(resourceDirPath);

  fs.ensureDirSync(path.join(resourceDirPath, 'src'));

  if (imageSource.type === IMAGE_SOURCE_TYPE.TEMPLATE) {
    fs.copySync(
      path.join(__dirname, '../../../resources/awscloudformation/container-templates', imageSource.template),
      path.join(resourceDirPath, 'src'),
      { recursive: true }
    );
    const { exposedContainer } = await generateContainersArtifacts(context, apiResource);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'exposedContainer', exposedContainer);

  }

  createDefaultCustomPoliciesFile(category, resourceName);

  const customPoliciesPath = pathManager.getCustomPoliciesPath(category, resourceName);

  context.print.success(`Successfully added resource ${resourceName} locally.`);
  context.print.info('');
  context.print.success('Next steps:');

  if (deploymentMechanism === DEPLOYMENT_MECHANISM.FULLY_MANAGED) {
    context.print.info(`- Place your Dockerfile, docker-compose.yml and any related container source files in "amplify/backend/api/${resourceName}/src"`);
  } else if (deploymentMechanism === DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
    context.print.info(
      `- Ensure you have the Dockerfile, docker-compose.yml and any related container source files in your Github path: ${gitHubInfo.path}`,
    );
  }

  context.print.info(
    `- Amplify CLI infers many configuration settings from the "docker-compose.yaml" file. Learn more: docs.amplify.aws/cli/usage/containers`,
  );
  context.print.info(`- To access AWS resources outside of this Amplify app, edit the ${customPoliciesPath}`);
  context.print.info('- Run "amplify push" to build and deploy your image');

  return resourceName;
};

const getResourceDependencies = async ({
  restrictAccess,
  dependsOn,
  context,
  resourceName,
  category,
}: {
  restrictAccess: boolean;
  dependsOn: ResourceDependency[];
  context: any;
  category: string;
  resourceName: string;
}) => {
  let authName;
  const updatedDependsOn: ResourceDependency[] = [].concat(dependsOn);

  updatedDependsOn.push({
    category: '',
    resourceName: NETWORK_STACK_LOGICAL_ID,
    attributes: ['ClusterName', 'VpcId', 'VpcCidrBlock', 'SubnetIds', 'VpcLinkId', 'CloudMapNamespaceId'],
  });

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
    const authDependency = updatedDependsOn.find(dependency => dependency.category === 'auth');

    if (authDependency === undefined) {
      updatedDependsOn.push({
        category: 'auth',
        resourceName: authName,
        attributes: ['UserPoolId', 'AppClientIDWeb'],
      });
    } else {
      const existingAttributes = authDependency.attributes;

      const newAttributes = new Set([...existingAttributes, 'UserPoolId', 'AppClientIDWeb']);

      authDependency.attributes = Array.from(newAttributes);
    }
  }
  return [authName, updatedDependsOn];
};

export const updateResource = async (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context, category) => {
  const options = await serviceWalkthroughPromise;

  const {
    dependsOn,
    restrictAccess,
    resourceName,
    gitHubPath,
    gitHubToken,
    gitHubInfo,
    mutableParametersState,
    categoryPolicies,
    environmentMap,
    deploymentMechanism,
  } = options;

  let [authResourceName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });

  let newGithubInfo: GitHubSourceActionInfo = {
    path: gitHubPath,
    tokenSecretArn: gitHubInfo && gitHubInfo.tokenSecretArn,
  };
  if (gitHubToken) {
    //#region Add token to secrets manager and get arn
    const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];

    const secretName = `${StackName}-${category}-${resourceName}-github-token`;
    const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'updateSecret', {
      secret: gitHubToken,
      description: 'GitHub OAuth token',
      name: secretName,
      version: uuid(),
    });

    newGithubInfo.tokenSecretArn = secretArn;
    //#endregion
  }

  if (deploymentMechanism === DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'gitHubInfo', newGithubInfo);
  }

  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'restrictAccess', restrictAccess);
  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'authName', authResourceName);
  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'environmentMap', environmentMap);
  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'dependsOn', updatedDependsOn);
  await context.amplify.updateamplifyMetaAfterResourceUpdate(
    category,
    options.resourceName,
    'mutableParametersState',
    mutableParametersState,
  );
  await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'categoryPolicies', categoryPolicies);

  const apiResource = (await context.amplify.getProjectMeta().api[options.resourceName]) as ApiResource;
  apiResource.category = category;

  try {
    const askForExposedContainer = true;
    const { exposedContainer } = await generateContainersArtifacts(context, apiResource, askForExposedContainer);
    await context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'exposedContainer', exposedContainer);
  } catch (err) {
    // Best effort to create templates
  }
};
