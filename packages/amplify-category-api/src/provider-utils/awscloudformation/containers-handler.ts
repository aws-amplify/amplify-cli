import fs from 'fs-extra';
import path from 'path';
import { API_TYPE, IMAGE_SOURCE_TYPE, ResourceDependency, ServiceConfiguration } from './service-walkthroughs/containers-walkthrough';
import { containerFiles as containerFilesREST } from './container-artifacts';
import { containerFiles as containerFilesGraphQL } from './container-artifacts-graphql';
import { DEPLOYMENT_MECHANISM } from './ecs-stack';
import { GitHubSourceActionInfo } from './PipelineWithAwaiter';
import uuid from 'uuid';
import { NETWORK_STACK_LOGICAL_ID } from '../../category-constants';

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
    githubPath,
    githubToken,
    deploymentMechanism,
    categoryPolicies,
    environmentMap,
    dependsOn = [],
    mutableParametersState,
  } = walkthroughOptions;
  const resourceDirPath = path.join(projectBackendDirPath, category, resourceName);

  let [authName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });

  //#region Add token to secrets manager and get arn
  let githubInfo: GitHubSourceActionInfo;

  if (deploymentMechanism === DEPLOYMENT_MECHANISM.INDENPENDENTLY_MANAGED) {
    const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];

    const secretName = `${StackName}-${category}-${resourceName}-github-token`;
    const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'newSecret', {
      secret: githubToken,
      description: 'GitHub OAuth token',
      name: secretName,
      version: secretName,
    });

    const githubTokenSecretArn = secretArn;

    githubInfo = {
      path: githubPath,
      tokenSecretArn: githubTokenSecretArn,
    };
  }

  //#endregion

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
    githubInfo,
    authName,
    environmentMap,
    categoryPolicies,
    mutableParametersState,
    skipHashing: true,
  };

  fs.ensureDirSync(resourceDirPath);

  if (imageSource.type === IMAGE_SOURCE_TYPE.TEMPLATE) {
    fs.ensureDirSync(path.join(resourceDirPath, 'src'));

    // TODO: Move this to resources
    switch (apiType) {
      case API_TYPE.GRAPHQL:
        Object.entries(containerFilesGraphQL).forEach(([fileName, fileContents]) => {
          fs.writeFileSync(path.join(resourceDirPath, 'src', fileName), fileContents);
        });
        break;
      case API_TYPE.REST:
        Object.entries(containerFilesREST).forEach(([fileName, fileContents]) => {
          fs.writeFileSync(path.join(resourceDirPath, 'src', fileName), fileContents);
        });
        break;
      default:
        exhaustiveCheck(apiType);
        function exhaustiveCheck(obj: never) {
          throw new Error(`${obj} invalid API Type`);
        }
    }
  }

  context.amplify.updateamplifyMetaAfterResourceAdd(category, resourceName, options);

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
  const { checkRequirements, externalAuthEnable } = await import('amplify-category-auth');

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
    const satisfiedRequirements = await checkRequirements(apiRequirements, context, category, resourceName);
    // checking to see if any requirements are unsatisfied
    const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

    if (foundUnmetRequirements) {
      try {
        authName = await externalAuthEnable(context, 'api', resourceName, apiRequirements);
      } catch (e) {
        context.print.error(e);
        throw e;
      }
    } else {
      [authName] = Object.keys(context.amplify.getProjectDetails().amplifyMeta.auth);
    }
    updatedDependsOn.push({
      category: 'auth',
      resourceName: authName,
      attributes: ['UserPoolId', 'AppClientIDWeb'],
    });
  }
  return [authName, updatedDependsOn];
};

export const updateResource = async (serviceWalkthroughPromise: Promise<ServiceConfiguration>, context, category) => {
  const options = await serviceWalkthroughPromise;

  const {
    dependsOn,
    restrictAccess,
    resourceName,
    githubPath,
    githubToken,
    githubInfo,
    mutableParametersState,
    categoryPolicies,
    environmentMap,
  } = options;

  let [authName, updatedDependsOn] = await getResourceDependencies({ dependsOn, restrictAccess, category, resourceName, context });

  let newGithubInfo: GitHubSourceActionInfo = {
    path: githubPath,
    tokenSecretArn: githubInfo && githubInfo.tokenSecretArn,
  };
  if (githubToken) {
    //#region Add token to secrets manager and get arn
    const { StackName } = context.amplify.getProjectDetails().amplifyMeta.providers['awscloudformation'];

    const secretName = `${StackName}-${category}-${resourceName}-github-token`;
    const { ARN: secretArn } = await context.amplify.executeProviderUtils(context, 'awscloudformation', 'updateSecret', {
      secret: githubToken,
      description: 'GitHub OAuth token',
      name: secretName,
      version: uuid(),
    });

    newGithubInfo.tokenSecretArn = secretArn;
    //#endregion
  }

  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'githubInfo', newGithubInfo);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'restrictAccess', restrictAccess);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'authName', authName);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'environmentMap', environmentMap);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'dependsOn', updatedDependsOn);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'mutableParametersState', mutableParametersState);
  context.amplify.updateamplifyMetaAfterResourceUpdate(category, options.resourceName, 'categoryPolicies', categoryPolicies);
};
