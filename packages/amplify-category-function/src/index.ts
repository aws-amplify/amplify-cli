import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSAny, $TSContext, pathManager, stateManager,
} from 'amplify-cli-core';
import { BuildType, FunctionBreadcrumbs, FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import _ from 'lodash';
import * as path from 'path';
import sequential from 'promise-sequential';
import { categoryName } from './constants';
import { postEnvRemoveHandler } from './events/postEnvRemoveHandler';
import { postPushHandler } from './events/postPushHandler';
import { preExportHandler } from './events/preExportHandler';
import { prePushHandler } from './events/prePushHandler';
// eslint-disable-next-line import/no-cycle
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { cloneSecretsOnEnvInitHandler } from './provider-utils/awscloudformation/secrets/cloneSecretsOnEnvInitHandler';
import { getLocalFunctionSecretNames } from './provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { getAppId, secretsPathAmplifyAppIdKey } from './provider-utils/awscloudformation/secrets/secretName';
import { buildFunction, buildTypeKeyMap } from './provider-utils/awscloudformation/utils/buildFunction';
import { ServiceName } from './provider-utils/awscloudformation/utils/constants';
import { askEnvironmentVariableCarryOut } from './provider-utils/awscloudformation/utils/environmentVariablesHelper';
import {
  deleteLayerVersionPermissionsToBeUpdatedInCfn,
  deleteLayerVersionsToBeRemovedByCfn,
} from './provider-utils/awscloudformation/utils/layerConfiguration';
import { checkContentChanges } from './provider-utils/awscloudformation/utils/packageLayer';
// eslint-disable-next-line import/no-cycle
import { supportedServices } from './provider-utils/supported-services';

export { categoryName as category } from './constants';
export { askExecRolePermissionsQuestions } from './provider-utils/awscloudformation/service-walkthroughs/execPermissionsWalkthrough';
export { buildResource } from './provider-utils/awscloudformation/utils/build';
export { buildTypeKeyMap } from './provider-utils/awscloudformation/utils/buildFunction';
export { ServiceName } from './provider-utils/awscloudformation/utils/constants';
export { lambdasWithApiDependency } from './provider-utils/awscloudformation/utils/getDependentFunction';
export { hashLayerResource } from './provider-utils/awscloudformation/utils/layerHelpers';
export { migrateLegacyLayer } from './provider-utils/awscloudformation/utils/layerMigrationUtils';
export { packageResource } from './provider-utils/awscloudformation/utils/package';
export {
  updateDependentFunctionsCfn,
  addAppSyncInvokeMethodPermission,
} from './provider-utils/awscloudformation/utils/updateDependentFunctionCfn';
export { loadFunctionParameters } from './provider-utils/awscloudformation/utils/loadFunctionParameters';

/**
 * Entry point for adding function resource
 */
export const add = async (context, providerName, service, parameters): Promise<string> => {
  const options = {
    service,
    providerPlugin: providerName,
    build: true,
  };
  // eslint-disable-next-line
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return undefined;
  }
  return providerController.addResource(context, categoryName, service, options, parameters);
};

/**
 * Entry point for updating function resource
 */
export const update = async (context, providerName, service, parameters, resourceToUpdate): Promise<$TSAny> => {
  // eslint-disable-next-line
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return undefined;
  }
  return providerController.updateResource(context, categoryName, service, parameters, resourceToUpdate);
};

/**
 * Not implemented
 */
export const console = async (context: $TSContext): Promise<void> => {
  context.print.info(`to be implemented: ${categoryName} console`);
};

/**
 * Migrate from original function config
 */
export const migrate = async (context: $TSContext): Promise<void> => {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach(category => {
    if (category === categoryName) {
      Object.keys(amplifyMeta[category]).forEach(resourceName => {
        try {
          // eslint-disable-next-line
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
};

/**
 * Get permissions for depending on functions
 */
export const getPermissionPolicies = async (
  context: $TSContext,
  resourceOpsMapping: $TSAny,
): Promise<{ permissionPolicies: $TSAny[]; resourceAttributes: $TSAny[]; }> => {
  const amplifyMeta = context.amplify.getProjectMeta();
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerName = amplifyMeta[categoryName][resourceName].providerPlugin;
      if (providerName) {
        // eslint-disable-next-line
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
};

/**
 * Initialize new environment with function
 */
export const initEnv = async (context: $TSContext): Promise<void> => {
  const { amplify } = context;
  const { envName } = amplify.getEnvInfo();
  const {
    allResources, resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated,
  } = await amplify.getResourceStatus(categoryName);

  // getResourceStatus will add dependencies of other types even when filtering by category, so we need to filter them out here
  const resourceCategoryFilter = (resource: {category: string}): boolean => resource.category === categoryName;

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
  // gets regenerated in initialize-env.ts in the amplify-cli package
  const envParamManager = (await ensureEnvParamManager()).instance;
  const projectPath = pathManager.findProjectRoot();
  const currentAmplifyMeta = stateManager.getCurrentMeta(projectPath);
  const amplifyMeta = stateManager.getMeta(projectPath);
  const changedResources = [...resourcesToBeCreated, ...resourcesToBeDeleted, ...resourcesToBeUpdated];
  allResources
    .filter(resourceCategoryFilter)
    .filter(r => !changedResources.includes(r))
    .forEach(r => {
      const { resourceName }: { resourceName: string } = r;
      const resourceParamManager = envParamManager.getResourceParamManager(categoryName, resourceName);

      const s3Bucket = _.get(currentAmplifyMeta, [categoryName, resourceName, 's3Bucket'], undefined);
      if (s3Bucket) {
        resourceParamManager.setParams(s3Bucket);
        _.set(amplifyMeta, [categoryName, resourceName, 's3Bucket'], s3Bucket);
      }

      // if the function has secrets, set the appId key in team-provider-info
      if (getLocalFunctionSecretNames(resourceName, { fromCurrentCloudBackend: true }).length > 0) {
        resourceParamManager.setParam(secretsPathAmplifyAppIdKey, getAppId());
      }
    });
  const sourceEnvParamManager = (await ensureEnvParamManager(sourceEnv)).instance;
  resourcesToBeCreated.forEach(resource => {
    const { resourceName, service } = resource;
    const sourceEnvResourceParamManager = sourceEnvParamManager.getResourceParamManager(categoryName, resourceName);
    const currentEnvResourceParamManager = envParamManager.getResourceParamManager(categoryName, resourceName);

    if (service === ServiceName.LambdaFunction) {
      if (sourceEnv && isNewEnv) {
        const groupName = sourceEnvResourceParamManager.getParam('GROUP');
        if (groupName) {
          currentEnvResourceParamManager.setParam('GROUP', groupName);
        }
      }
    }
  });

  stateManager.setMeta(projectPath, amplifyMeta);

  await sequential(functionTasks);

  if (isNewEnv) {
    const yesFlagSet = _.get(context, ['parameters', 'options', 'yes'], false);
    await askEnvironmentVariableCarryOut(context, sourceEnv, yesFlagSet);
    await cloneSecretsOnEnvInitHandler(context, sourceEnv, envName);
  }
};

/**
 * Returns a wrapper around FunctionRuntimeLifecycleManager.invoke() that can be used to invoke the function with only an event
 */
export const getInvoker = async (
  context: $TSContext,
  { handler, resourceName, envVars }: InvokerParameters,
): Promise<({ event: unknown }
) => Promise<$TSAny>> => {
  const resourcePath = path.join(pathManager.getBackendDirPath(), categoryName, resourceName);
  const { pluginId, functionRuntime }: FunctionBreadcrumbs = context.amplify.readBreadcrumbs(categoryName, resourceName);
  const runtimeManager: FunctionRuntimeLifecycleManager = await context.amplify.loadRuntimePlugin(context, pluginId);

  return ({ event }) => runtimeManager.invoke({
    handler,
    event: JSON.stringify(event),
    runtime: functionRuntime,
    srcRoot: resourcePath,
    envVars,
  });
};

/**
 * Returns a function that can build the lambda function
 */
export const getBuilder = (context: $TSContext, resourceName: string, buildType: BuildType): () => Promise<void> => {
  const meta = stateManager.getMeta();
  const lastBuildTimestamp = _.get(meta, [categoryName, resourceName, buildTypeKeyMap[buildType]]);
  const lastBuildType = _.get(meta, [categoryName, resourceName, 'lastBuildType']);

  return async () => {
    await buildFunction(context, {
      resourceName, buildType, lastBuildTimestamp, lastBuildType,
    });
  };
};

/**
 * Whether or not this function can be mocked
 */
export const isMockable = (context: $TSContext, resourceName: string): IsMockableResponse => {
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
        'Mocking a function with layers is not supported. '
        + 'To test in the cloud: run "amplify push" to deploy your function to the cloud '
        + 'and then run "amplify console function" to test your function in the Lambda console.',
    };
  }
  return supportedServices[service].providerController.isMockable(service);
};

/**
 * Main entry point for function subcommand
 */
export const executeAmplifyCommand = async (context: $TSContext): Promise<void> => {
  await ensureEnvParamManager();
  let commandPath = path.normalize(path.join(__dirname, 'commands'));
  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  // eslint-disable-next-line
  const commandModule = require(commandPath);
  await commandModule.run(context);
};

/**
 * Main entry point for handling lifecycle events
 */
export const handleAmplifyEvent = async (context: $TSContext, args: $TSAny): Promise<void> => {
  switch (args.event) {
    case 'PrePush':
      await prePushHandler(context);
      break;
    case 'PostPush':
      await postPushHandler(context);
      break;
    case 'InternalOnlyPostEnvRemove':
      await postEnvRemoveHandler(context, args?.data?.envName);
      break;
    case 'PreExport':
      await preExportHandler();
      break;
    default:
      // other event handlers not implemented
  }
};

/**
 * Prompt for lambda layers
 */
export const lambdaLayerPrompt = async (context: $TSContext, resources: $TSAny[]): Promise<void> => {
  const lambdaLayerResource = getLambdaLayerResources(resources);
  await checkContentChanges(context, lambdaLayerResource);
};

const getLambdaLayerResources = (resources: $TSAny[]): $TSAny[] => resources
  .filter(r => r.service === ServiceName.LambdaLayer && r.category === categoryName);

/**
 * Lambda layer cleanup
 */
export const postPushCleanup = async (resource: $TSAny[], envName: string): Promise<void> => {
  const lambdaLayerResource = getLambdaLayerResources(resource);
  lambdaLayerResource.forEach(llResource => {
    deleteLayerVersionsToBeRemovedByCfn(llResource.resourceName, envName);
    deleteLayerVersionPermissionsToBeUpdatedInCfn(llResource.resourceName, envName);
  });
};

// Object used for internal invocation of lambda functions
/**
 * Input to the function invoker
 */
export type InvokerParameters = {
  resourceName: string;
  handler: string;
  envVars?: { [key: string]: string };
};

/**
 * Response from isMockable
 */
export interface IsMockableResponse {
  isMockable: boolean;
  reason?: string;
}
