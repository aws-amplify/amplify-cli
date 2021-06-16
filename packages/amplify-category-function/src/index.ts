import { $TSAny, $TSContext, pathManager, stateManager } from 'amplify-cli-core';
import { BuildType, FunctionBreadcrumbs, FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import * as path from 'path';
import sequential from 'promise-sequential';
import { categoryName } from './constants';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { buildFunction, buildTypeKeyMap } from './provider-utils/awscloudformation/utils/buildFunction';
import { ServiceName } from './provider-utils/awscloudformation/utils/constants';
import {
  deleteLayerVersionPermissionsToBeUpdatedInCfn,
  deleteLayerVersionsToBeRemovedByCfn,
} from './provider-utils/awscloudformation/utils/layerConfiguration';
import { checkContentChanges } from './provider-utils/awscloudformation/utils/packageLayer';
import { supportedServices } from './provider-utils/supported-services';

export { categoryName as category } from './constants';
export { askExecRolePermissionsQuestions } from './provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
export { lambdasWithApiDependency } from './provider-utils/awscloudformation/utils/getDependentFunction';
export { buildResource } from './provider-utils/awscloudformation/utils/build';
export { buildTypeKeyMap } from './provider-utils/awscloudformation/utils/buildFunction';
export { ServiceName } from './provider-utils/awscloudformation/utils/constants';
export { hashLayerResource } from './provider-utils/awscloudformation/utils/layerHelpers';
export { migrateLegacyLayer } from './provider-utils/awscloudformation/utils/layerMigrationUtils';
export { packageResource } from './provider-utils/awscloudformation/utils/package';
export { updateDependentFunctionsCfn } from './provider-utils/awscloudformation/utils/updateDependentFunctionCfn';

export async function add(context, providerName, service, parameters) {
  const options = {
    service,
    providerPlugin: providerName,
    build: true,
  };
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.addResource(context, categoryName, service, options, parameters);
}

export async function update(context, providerName, service, parameters, resourceToUpdate) {
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.updateResource(context, categoryName, service, parameters, resourceToUpdate);
}

export async function console(context) {
  context.print.info(`to be implemented: ${categoryName} console`);
}

export async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach(category => {
    if (category === categoryName) {
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
          if (providerController) {
            migrateResourcePromises.push(
              providerController.migrateResource(context, projectPath, amplifyMeta[category][resourceName].service, resourceName),
            );
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

export async function getPermissionPolicies(context, resourceOpsMapping) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerName = amplifyMeta[categoryName][resourceName].providerPlugin;
      if (providerName) {
        const providerController = require(`./provider-utils/${providerName}/index`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[categoryName][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category: categoryName });
      } else {
        context.print.error(`Provider not configured for ${categoryName}: ${resourceName}`);
      }
    } catch (e) {
      context.print.warning(`Could not get policies for ${categoryName}: ${resourceName}`);
      throw e;
    }
  });
  return { permissionPolicies, resourceAttributes };
}

export async function initEnv(context) {
  const { amplify } = context;
  const { envName } = amplify.getEnvInfo();
  const { allResources, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated } = await amplify.getResourceStatus(categoryName);

  // getResourceStatus will add dependencies of other types even when filtering by category, so we need to filter them out here
  const resourceCategoryFilter = resource => resource.category === categoryName;

  resourcesToBeDeleted.filter(resourceCategoryFilter).forEach(functionResource => {
    amplify.removeResourceParameters(context, categoryName, functionResource.resourceName);
  });

  const tasks = resourcesToBeCreated.concat(resourcesToBeUpdated).filter(resourceCategoryFilter);

  const functionTasks = tasks.map(functionResource => {
    const { resourceName, service } = functionResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, resourceName, service);
      amplify.saveEnvResourceParameters(context, categoryName, resourceName, config);
    };
  });
  const sourceEnv = context.exeInfo?.sourceEnvName;
  const isNewEnv = context.exeInfo?.isNewEnv;

  // Need to fetch metadata from #current-cloud-backend, since amplifyMeta
  // gets regenerated in intialize-env.ts in the amplify-cli package
  const projectPath = pathManager.findProjectRoot();
  const teamProviderInfo = stateManager.getTeamProviderInfo(projectPath);
  const currentAmplifyMeta = stateManager.getCurrentMeta(projectPath);
  const amplifyMeta = stateManager.getMeta(projectPath);
  const changedResources = [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated];
  allResources
    .filter(resourceCategoryFilter)
    .filter(r => !changedResources.includes(r))
    .forEach(r => {
      const { resourceName }: { resourceName: string } = r;

      const s3Bucket = _.get(currentAmplifyMeta, [categoryName, resourceName, 's3Bucket'], undefined);
      if (s3Bucket) {
        const tpiResourceParams = _.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], {});
        _.assign(tpiResourceParams, s3Bucket);
        _.set(teamProviderInfo, [envName, 'categories', categoryName, resourceName], tpiResourceParams);
        _.set(amplifyMeta, [categoryName, resourceName, 's3Bucket'], s3Bucket);
      }
    });
  resourcesToBeCreated.forEach(resource => {
    const { resourceName, service } = resource;
    if (service === ServiceName.LambdaFunction) {
      if (sourceEnv && isNewEnv) {
        const groupName = _.get(teamProviderInfo, [sourceEnv, 'categories', categoryName, resourceName, 'GROUP']);
        if (groupName) {
          _.set(teamProviderInfo, [envName, 'categories', categoryName, resourceName, 'GROUP'], groupName);
        }
      }
    }
  });

  stateManager.setMeta(projectPath, amplifyMeta);
  stateManager.setTeamProviderInfo(projectPath, teamProviderInfo);

  await sequential(functionTasks);
}

// Returns a wrapper around FunctionRuntimeLifecycleManager.invoke() that can be used to invoke the function with only an event
export async function getInvoker(
  context: $TSContext,
  { handler, resourceName, envVars }: InvokerParameters,
): Promise<({ event: unknown }) => Promise<$TSAny>> {
  const resourcePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const { pluginId, functionRuntime }: FunctionBreadcrumbs = context.amplify.readBreadcrumbs(categoryName, resourceName);
  const runtimeManager: FunctionRuntimeLifecycleManager = await context.amplify.loadRuntimePlugin(context, pluginId);

  return ({ event }) =>
    runtimeManager.invoke({
      handler: handler,
      event: JSON.stringify(event),
      runtime: functionRuntime,
      srcRoot: resourcePath,
      envVars: envVars,
    });
}

export function getBuilder(context: $TSContext, resourceName: string, buildType: BuildType): () => Promise<void> {
  const lastBuildTimestamp = _.get(stateManager.getMeta(), [categoryName, resourceName, buildTypeKeyMap[buildType]]);
  return async () => {
    await buildFunction(context, { resourceName, buildType, lastBuildTimestamp });
  };
}

export function isMockable(context: any, resourceName: string): IsMockableResponse {
  const resourceValue = _.get(context.amplify.getProjectMeta(), [categoryName, resourceName]);
  if (!resourceValue) {
    return {
      isMockable: false,
      reason: `Could not find the specified ${categoryName}: ${resourceName}`,
    };
  }
  const { service, dependsOn } = resourceValue;

  const dependsOnLayers = Array.isArray(dependsOn)
    ? dependsOn
        .filter(dependency => dependency.category === categoryName)
        .map(val => _.get(context.amplify.getProjectMeta(), [val.category, val.resourceName]))
        .filter(val => val.service === ServiceName.LambdaLayer)
    : [];

  const hasLayer = service === ServiceName.LambdaFunction && Array.isArray(dependsOnLayers) && dependsOnLayers.length !== 0;
  if (hasLayer) {
    return {
      isMockable: false,
      reason:
        'Mocking a function with layers is not supported. ' +
        'To test in the cloud: run "amplify push" to deploy your function to the cloud ' +
        'and then run "amplify console function" to test your function in the Lambda console.',
    };
  }
  return supportedServices[service].providerController.isMockable(service);
}

export async function executeAmplifyCommand(context) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context, args) {
  context.print.info(`${categoryName} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
}

export async function lambdaLayerPrompt(context: $TSContext, resources: Array<$TSAny>): Promise<void> {
  const lambdaLayerResource = getLambdaLayerResources(resources);
  await checkContentChanges(context, lambdaLayerResource);
}

function getLambdaLayerResources(resources: Array<$TSAny>) {
  return resources.filter(r => r.service === ServiceName.LambdaLayer && r.category === categoryName);
}

export async function postPushCleanup(resource: Array<$TSAny>, envName: string): Promise<void> {
  const lambdaLayerResource = getLambdaLayerResources(resource);
  lambdaLayerResource.forEach(resource => {
    deleteLayerVersionsToBeRemovedByCfn(resource.resourceName, envName);
    deleteLayerVersionPermissionsToBeUpdatedInCfn(resource.resourceName, envName);
  });
}

// Object used for internal invocation of lambda functions
export type InvokerParameters = {
  resourceName: string;
  handler: string;
  envVars?: { [key: string]: string };
};

export interface IsMockableResponse {
  isMockable: boolean;
  reason?: string;
}
