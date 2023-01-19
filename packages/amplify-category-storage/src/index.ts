import { $TSAny, $TSContext, AmplifyCategories, AmplifySupportedService, IAmplifyResource } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import {
  validateAddStorageRequest,
  validateImportStorageRequest,
  validateRemoveStorageRequest,
  validateUpdateStorageRequest,
} from 'amplify-util-headless-input';
import * as path from 'path';
import sequential from 'promise-sequential';
import { categoryName } from './constants';
import { updateConfigOnEnvInit } from './provider-utils/awscloudformation';
import { DDBStackTransform } from './provider-utils/awscloudformation/cdk-stack-builder/ddb-stack-transform';
import { transformS3ResourceStack } from './provider-utils/awscloudformation/cdk-stack-builder/s3-stack-transform';
import { getAllDefaults } from './provider-utils/awscloudformation/default-values/s3-defaults';
import {
  S3AccessType,
  S3PermissionType,
  S3UserInputs,
} from './provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
import { DynamoDBInputState } from './provider-utils/awscloudformation/service-walkthroughs/dynamoDB-input-state';
import {
  headlessAddStorage,
  headlessImportStorage,
  headlessRemoveStorage,
  headlessUpdateStorage,
} from './provider-utils/awscloudformation/storage-configuration-helpers';
export { categoryName as category } from './constants';
export {
  S3UserInputs,
  S3UserInputTriggerFunctionParams,
} from './provider-utils/awscloudformation/service-walkthrough-types/s3-user-input-types';
//S3-Control-API used by Predictions
export {
  s3AddStorageLambdaTrigger,
  s3CreateStorageResource,
  s3GetResourceName,
  s3GetUserInput,
  s3RegisterAdminTrigger,
  s3RemoveAdminLambdaTrigger,
  s3RemoveStorageLambdaTrigger,
} from './provider-utils/awscloudformation/service-walkthroughs/s3-resource-api';

export async function s3GetBucketUserInputDefault(project: $TSAny, shortId: string, accessType: S3AccessType): Promise<S3UserInputs> {
  const defaultS3UserInputs = getAllDefaults(project, shortId);
  switch (accessType) {
    case S3AccessType.AUTH_ONLY:
      defaultS3UserInputs.authAccess = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
      break;
    case S3AccessType.AUTH_AND_GUEST:
      defaultS3UserInputs.authAccess = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
      defaultS3UserInputs.guestAccess = [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ];
      break;
  }
  return defaultS3UserInputs;
}

export async function getDefaultAuthPermissions() {
  return [S3PermissionType.CREATE_AND_UPDATE, S3PermissionType.READ, S3PermissionType.DELETE];
}

export async function add(context: any, providerName: any, service: any) {
  const options = {
    service,
    providerPlugin: providerName,
  };

  const providerController = require(`./provider-utils/${providerName}`);

  if (!providerController) {
    printer.error('Provider not configured for this category');
    return undefined;
  }

  return providerController.addResource(context, AmplifyCategories.STORAGE, service, options);
}

export async function console(context: any) {
  printer.info(`to be implemented: ${AmplifyCategories.STORAGE} console`);
}

export async function migrateStorageCategory(context: any) {
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

export async function transformCategoryStack(context: $TSContext, resource: IAmplifyResource) {
  if (resource.service === AmplifySupportedService.DYNAMODB) {
    if (canResourceBeTransformed(context, resource.resourceName)) {
      const stackGenerator = new DDBStackTransform(context, resource.resourceName);
      await stackGenerator.transform();
    }
  } else if (resource.service === AmplifySupportedService.S3) {
    await transformS3ResourceStack(context, resource);
  }
}

export function canResourceBeTransformed(context: $TSContext, resourceName: string) {
  const resourceInputState = new DynamoDBInputState(context, resourceName);
  return resourceInputState.cliInputFileExists();
}

export async function getPermissionPolicies(context: any, resourceOpsMapping: any) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies: any = [];
  const resourceAttributes: any = [];
  const storageCategory = AmplifyCategories.STORAGE;

  for (const resourceName of Object.keys(resourceOpsMapping)) {
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
        resourceAttributes.push({ resourceName, attributes, category: storageCategory });
      } else {
        printer.error(`Provider not configured for ${storageCategory}: ${resourceName}`);
      }
    } catch (e) {
      printer.warn(`Could not get policies for ${storageCategory}: ${resourceName}`);
      throw e;
    }
  }

  return { permissionPolicies, resourceAttributes };
}

export async function executeAmplifyCommand(context: any) {
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
  context.usageData.pushHeadlessFlow(headlessPayload, context.input);
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

export async function initEnv(context: any) {
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
