import path from 'path';
import { category } from './constants';
export { category } from './constants';
import { FunctionBreadcrumbs, FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import sequential from 'promise-sequential';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { supportedServices } from './provider-utils/supported-services';
import _ from 'lodash';
export { packageLayer, hashLayerResource } from './provider-utils/awscloudformation/utils/packageLayer';
import { ServiceName } from './provider-utils/awscloudformation/utils/constants';
export { ServiceName } from './provider-utils/awscloudformation/utils/constants';

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
  return providerController.addResource(context, category, service, options, parameters);
}

export async function update(context, providerName, service, parameters, resourceToUpdate) {
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }
  return providerController.updateResource(context, category, service, parameters, resourceToUpdate);
}

export async function console(context) {
  context.print.info(`to be implemented: ${category} console`);
}

export async function migrate(context) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach(categoryName => {
    if (categoryName === category) {
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
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
      if (providerController) {
        const { policy, attributes } = providerController.getPermissionPolicies(
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
  });
  return { permissionPolicies, resourceAttributes };
}

export async function initEnv(context) {
  const { amplify } = context;
  const { resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated } = await amplify.getResourceStatus(category);

  // getResourceStatus will add dependencies of other types even when filtering by category, so we need to filter them out here
  const resourceCategoryFilter = resource => resource.category === category;

  resourcesToBeDeleted.filter(resourceCategoryFilter).forEach(functionResource => {
    amplify.removeResourceParameters(context, category, functionResource.resourceName);
  });

  const tasks = resourcesToBeCreated.concat(resourcesToBeUpdated).filter(resourceCategoryFilter);

  const functionTasks = tasks.map(functionResource => {
    const { resourceName, service } = functionResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, resourceName, service);
      context.amplify.saveEnvResourceParameters(context, category, resourceName, config);
    };
  });

  await sequential(functionTasks);
}

// returns a function that can be used to invoke the lambda locally
export async function getInvoker(context: any, params: InvokerParameters): Promise<({ event: any }) => Promise<any>> {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), category, params.resourceName);
  const breadcrumbs: FunctionBreadcrumbs = context.amplify.readBreadcrumbs(context, category, params.resourceName);
  const runtimeManager: FunctionRuntimeLifecycleManager = await context.amplify.loadRuntimePlugin(context, breadcrumbs.pluginId);

  const lastBuildTimestampStr = (await context.amplify.getResourceStatus(category, params.resourceName)).allResources.find(
    resource => resource.resourceName === params.resourceName,
  ).lastBuildTimeStamp as string;

  return async request =>
    await runtimeManager.invoke({
      handler: params.handler,
      event: JSON.stringify(request.event),
      env: context.amplify.getEnvInfo().envName,
      runtime: breadcrumbs.functionRuntime,
      srcRoot: resourcePath,
      envVars: params.envVars,
      lastBuildTimestamp: lastBuildTimestampStr ? new Date(lastBuildTimestampStr) : undefined,
    });
}

export function isMockable(context: any, resourceName: string): IsMockableResponse {
  const { service, dependsOn } = context.amplify.getProjectMeta()[category][resourceName];
  const hasLayer =
    service === ServiceName.LambdaFunction &&
    Array.isArray(dependsOn) &&
    dependsOn.filter(dependency => dependency.category === 'function').length !== 0;
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
    commandPath = path.join(commandPath, category);
  } else {
    commandPath = path.join(commandPath, category, context.input.command);
  }

  const commandModule = require(commandPath);
  await commandModule.run(context);
}

export async function handleAmplifyEvent(context, args) {
  context.print.info(`${category} handleAmplifyEvent to be implemented`);
  context.print.info(`Received event args ${args}`);
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
