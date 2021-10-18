import { $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import {
  validateAddStorageRequest,
  validateImportStorageRequest,
  validateRemoveStorageRequest,
  validateUpdateStorageRequest
} from 'amplify-util-headless-input';
import * as path from 'path';
import sequential from 'promise-sequential';
import { categoryName } from './constants';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { DDBStackTransform } from './provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import { transformS3ResourceStack } from './provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import { DynamoDBInputState } from './provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import {
  headlessAddStorage,
  headlessImportStorage,
  headlessRemoveStorage,
  headlessUpdateStorage
} from './provider-utils/awscloudformation/storage-configuration-helpers';
export { categoryName as category } from './constants';
export { AmplifyDDBResourceTemplate } from './provider-utils/awscloudformation/cdk-stack-builder/types';


async function add(context: any, providerName: any, service: any) {
  const options = {
    service,
    providerPlugin: providerName,
  };

  const providerController = require(`./provider-utils/${providerName}`);

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return;
  }

  return providerController.addResource(context, AmplifyCategories.STORAGE, service, options);
}

async function categoryConsole(context: any) {
  printer.info(`to be implemented: ${AmplifyCategories.STORAGE} console`);
}

async function migrateStorageCategory(context: any) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises: any = [];

  Object.keys(amplifyMeta).forEach(categoryName => {
    if (categoryName === AmplifyCategories.STORAGE) {
      Object.keys(amplifyMeta[AmplifyCategories.STORAGE]).forEach(resourceName => {
        try {
          const providerController = require(`./provider-utils/${amplifyMeta[AmplifyCategories.STORAGE][resourceName].providerPlugin}`);

          if (providerController) {
            migrateResourcePromises.push(
              providerController.migrateResource(
                context,
                projectPath,
                amplifyMeta[AmplifyCategories.STORAGE][resourceName].service,
                resourceName,
              ),
            );
          } else {
            printer.error(`Provider not configured for ${AmplifyCategories.STORAGE}: ${resourceName}`);
          }
        } catch (e) {
          printer.warn(`Could not run migration for ${AmplifyCategories.STORAGE}: ${resourceName}`);
          throw e;
        }
      });
    }
  });

  await Promise.all(migrateResourcePromises);
}

async function transformCategoryStack(context: $TSContext, resource: IAmplifyResource) {
  if (resource.service === AmplifySupportedService.DYNAMODB ) {
    if (canResourceBeTransformed(resource.resourceName)) {
      const stackGenerator = new DDBStackTransform(resource.resourceName);
      await stackGenerator.transform();
    }
  } else if (resource.service === AmplifySupportedService.S3) {
    await transformS3ResourceStack(context, resource);
  }
}

function canResourceBeTransformed(resourceName: string) {
  const resourceInputState = new DynamoDBInputState(resourceName);
  return resourceInputState.cliInputFileExists();
}

async function getPermissionPolicies(context: any, resourceOpsMapping: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies: any = [];
  const resourceAttributes: any = [];
  const storageCategory = AmplifyCategories.STORAGE;

  Object.keys(resourceOpsMapping).forEach(resourceName => {
    try {
      const providerPlugin =
        'providerPlugin' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].providerPlugin
          : amplifyMeta[storageCategory][resourceName].providerPlugin;
      const service =
        'service' in resourceOpsMapping[resourceName]
          ? resourceOpsMapping[resourceName].service
          : amplifyMeta[storageCategory][resourceName].service;

      if (providerPlugin) {
        const providerController = require(`./provider-utils/${providerPlugin}`);
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        if (Array.isArray(policy)) {
          permissionPolicies.push(...policy);
        } else {
          permissionPolicies.push(policy);
        }
        resourceAttributes.push({ resourceName, attributes, storageCategory });
      } else {
        printer.error(`Provider not configured for ${storageCategory}: ${resourceName}`);
      }
    } catch (e) {
      printer.warn(`Could not get policies for ${storageCategory}: ${resourceName}`);
      throw e;
    }
  });

  return { permissionPolicies, resourceAttributes };
}

async function executeAmplifyCommand(context: any) {
  let commandPath = path.normalize(path.join(__dirname, 'commands'));

  if (context.input.command === 'help') {
    commandPath = path.join(commandPath, AmplifyCategories.STORAGE);
  } else {
    commandPath = path.join(commandPath, AmplifyCategories.STORAGE, context.input.command);
  }

  const commandModule = require(commandPath);

  await commandModule.run(context);
}

export const executeAmplifyHeadlessCommand = async (context: $TSContext, headlessPayload: string) => {
  switch (context.input.command) {
    case 'add':
      await headlessAddStorage(context, await validateAddStorageRequest(headlessPayload));
      break;
    case 'update':
      await headlessUpdateStorage(context, await validateUpdateStorageRequest(headlessPayload));
      break;
    case 'remove':
      await headlessRemoveStorage(context, await validateRemoveStorageRequest(headlessPayload));
      break;
    case 'import':
      await headlessImportStorage(context, await validateImportStorageRequest(headlessPayload));
      break;
    default:
      printer.error(`Headless mode for ${context.input.command} storage is not implemented yet`);
  }
};

export async function handleAmplifyEvent(context: $TSContext, args: $TSAny) {
  printer.info(`${categoryName} handleAmplifyEvent to be implemented`);
  printer.info(`Received event args ${args}`);
}

async function initEnv(context: any) {
  const { resourcesToBeSynced, allResources } = await context.amplify.getResourceStatus(AmplifyCategories.STORAGE);
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  let toBeSynced = [];

  if (resourcesToBeSynced && resourcesToBeSynced.length > 0) {
    toBeSynced = resourcesToBeSynced.filter((b: any) => b.category === AmplifyCategories.STORAGE);
  }

  toBeSynced
    .filter((storageResource: any) => storageResource.sync === 'unlink')
    .forEach((storageResource: any) => {
      context.amplify.removeResourceParameters(context, AmplifyCategories.STORAGE, storageResource.resourceName);
    });

  let tasks: Record<string, any>[] = [];

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
      const config = await updateConfigOnEnvInit(context, AmplifyCategories.STORAGE, resourceName, service);
      context.amplify.saveEnvResourceParameters(context, AmplifyCategories.STORAGE, resourceName, config);
    };
  });

  await sequential(storageTasks);
}

module.exports = {
  add,
  console: categoryConsole,
  initEnv,
  migrate: migrateStorageCategory,
  getPermissionPolicies,
  executeAmplifyCommand,
  handleAmplifyEvent,
  transformCategoryStack,
  category: AmplifyCategories.STORAGE,
};
