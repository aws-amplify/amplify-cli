import { $TSAny, $TSContext, $TSObject, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import sequential from 'promise-sequential';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { categoryName } from './constants';
export { categoryName as category } from './constants';

export async function add(context: $TSContext, providerName: string, service: string) {
  const options = {
    service,
    providerPlugin: providerName,
  };

  const providerController = await import(`./provider-utils/${providerName}`);

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return;
  }

  return providerController.addResource(context, categoryName, service, options);
}

export async function console(context: $TSContext) {
  printer.info(`to be implemented: ${categoryName} console`);
}

export async function migrate(context: $TSContext) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises: Promise<$TSAny>[] = [];

  const categoryResources = amplifyMeta?.[categoryName] || {};

  for (const resourceName of Object.keys(categoryResources)) {
    try {
      const providerController = await import(`./provider-utils/${amplifyMeta[categoryName][resourceName].providerPlugin}`);

      if (providerController) {
        migrateResourcePromises.push(
          await providerController.migrateResource(context, projectPath, amplifyMeta[categoryName][resourceName].service, resourceName),
        );
      } else {
        printer.error(`Provider not configured for ${categoryName}: ${resourceName}`);
      }
    } catch (e) {
      printer.warn(`Could not run migration for ${categoryName}: ${resourceName}`);
      throw e;
    }
  }

  await Promise.all(migrateResourcePromises);
}

export async function getPermissionPolicies(context: $TSContext, resourceOpsMapping: $TSAny) {
  const amplifyMeta = stateManager.getMeta();
  const permissionPolicies: $TSAny[] = [];
  const resourceAttributes: $TSAny[] = [];

  for (const resourceName of Object.keys(resourceOpsMapping)) {
    try {
      const providerPlugin =
        'providerPlugin' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].providerPlugin
          : amplifyMeta[categoryName][resourceName].providerPlugin;
      const service =
        'service' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].service
          : amplifyMeta[categoryName][resourceName].service;

      if (providerPlugin) {
        const providerController = await import(`./provider-utils/${providerPlugin}`);
        const { policy, attributes } = await providerController.getPermissionPolicies(
          service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        if (Array.isArray(policy)) {
          permissionPolicies.push(...policy);
        } else {
          permissionPolicies.push(policy);
        }
        resourceAttributes.push({ resourceName, attributes, categoryName });
      } else {
        printer.error(`Provider not configured for ${categoryName}: ${resourceName}`);
      }
    } catch (e) {
      printer.warn(`Could not get policies for ${categoryName}: ${resourceName}`);
      throw e;
    }
  }

  return { permissionPolicies, resourceAttributes };
}

export async function executeAmplifyCommand(context: $TSContext) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));

  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, categoryName);
  } else {
    commandPath = path.join(commandPath, categoryName, context.input.command);
  }

  const commandModule = await import(commandPath);

  await commandModule.run(context);
}

export async function handleAmplifyEvent(context: $TSContext, args: $TSAny) {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

export async function initEnv(context: $TSContext) {
  const { resourcesToBeSynced, allResources } = await context.amplify.getResourceStatus(categoryName);
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  let toBeSynced: $TSObject[] = [];

  if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
    toBeSynced = resourcesToBeSynced.filter((b: $TSObject) => b.category === categoryName);
  }

  toBeSynced
    .filter(storageResource => storageResource.sync === 'unlink')
    .forEach(storageResource => {
      context.amplify.removeResourceParameters(context, categoryName, storageResource.resourceName);
    });

  let tasks: $TSAny[] = [];

  // For pull change detection for import sees a difference, to avoid duplicate tasks we don't
  // add the syncable resources, as allResources covers it, otherwise it is required for env add
  // to populate the output value and such, these sync resources have the 'refresh' sync value.
  if (!isPulling) {
    tasks = tasks.concat(toBeSynced);
  }

  // check if this initialization is happening on a pull
  if (isPulling && allResources.length > 0) {
    tasks.push(...allResources);
  }

  const storageTasks = tasks.map(storageResource => {
    const { resourceName, service } = storageResource;

    return async () => {
      const config = await updateConfigOnEnvInit(context, categoryName, resourceName, service);

      context.amplify.saveEnvResourceParameters(context, categoryName, resourceName, config);
    };
  });

  await sequential(storageTasks);
}
