import path from 'path';
import { category } from './constants';
import { categoryName } from './provider-utils/awscloudformation/utils/constants';
import { FunctionBreadcrumbs, FunctionRuntimeLifecycleManager } from 'amplify-function-plugin-interface';
import sequential from 'promise-sequential';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';

export async function add(context, providerName, service, parameters) {
  const options = {
    service,
    providerPlugin: providerName,
    build: true,
  };
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not confgiured for this category');
    return;
  }
  return providerController.addResource(context, category, service, options, parameters);
}

export async function update(context, providerName, service, parameters, resourceToUpdate) {
  const providerController = require(`./provider-utils/${providerName}/index`);
  if (!providerController) {
    context.print.error('Provider not confgiured for this category');
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
  const { resourcesToBeCreated, resourcesToBeDeleted, resourcesToBeUpdated } = await amplify.getResourceStatus('function');

  resourcesToBeDeleted.forEach(authResource => {
    amplify.removeResourceParameters(context, 'function', authResource.resourceName);
  });

  const tasks = resourcesToBeCreated.concat(resourcesToBeUpdated);

  const functionTasks = tasks.map(functionResource => {
    const { resourceName } = functionResource;
    return async () => {
      const config = await updateConfigOnEnvInit(context, 'function', resourceName);
      context.amplify.saveEnvResourceParameters(context, 'function', resourceName, config);
    };
  });

  await sequential(functionTasks);
}

// returns a function that can be used to invoke the lambda locally
export async function getInvoker(context: any, params: InvokerParameters): Promise<({ event: any }) => Promise<any>> {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), categoryName, params.resourceName);
  const breadcrumbs: FunctionBreadcrumbs = context.amplify.readBreadcrumbs(context, categoryName, params.resourceName);
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
      lastBuildTimestamp: new Date(lastBuildTimestampStr),
    });
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
