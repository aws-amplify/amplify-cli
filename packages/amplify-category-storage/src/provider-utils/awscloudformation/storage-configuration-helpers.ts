import {
  $TSAny,
  $TSContext,
  $TSMeta,
  $TSObject, ResourceAlreadyExistsError,
  ResourceDoesNotExistError,
  stateManager
} from 'amplify-cli-core';
import {
  AddStorageRequest,
  CrudOperation,
  ImportStorageRequest, RemoveStorageRequest, UpdateStorageRequest
} from 'amplify-headless-interface';
import { printer } from 'amplify-prompts';
import { v4 as uuid } from 'uuid';
import { S3UserInputTriggerFunctionParams } from '../..';
import { authCategoryName, categoryName } from '../../constants';
import { ProviderUtils } from '../awscloudformation/import/types';
import { updateStateFiles } from './import/import-s3';
import { ServiceName } from './provider-constants';
import { buildS3UserInputFromHeadlessStorageRequest, buildS3UserInputFromHeadlessUpdateStorageRequest, buildTriggerFunctionParams } from './s3-headless-adapter';
import {
  S3UserInputs
} from './service-walkthrough-types/s3-user-input-types';
import { s3AddStorageLambdaTrigger, s3CreateStorageResource, s3UpdateUserInput } from './service-walkthroughs/s3-resource-api';
import { resourceAlreadyExists } from './service-walkthroughs/s3-walkthrough';


// map of s3 actions corresponding to CRUD verbs
// 'create/update' have been consolidated since s3 only has put concept
export const permissionMap: $TSObject = {
  'create/update': ['s3:PutObject'],
  read: ['s3:GetObject', 's3:ListBucket'],
  delete: ['s3:DeleteObject'],
};

export async function headlessAddStorage(context: $TSContext, storageRequest: AddStorageRequest) {
  if (!checkIfAuthExists()) {
    const error = new Error(
      'Cannot headlessly add storage resource without an existing auth resource. It can be added with "amplify add auth"',
    );
    await context.usageData.emitError(error);
    error.stack = undefined;
    throw error;
  }

  if (storageRequest.serviceConfiguration.serviceName === ServiceName.S3) {
    if (resourceAlreadyExists()) {
      const error = new ResourceAlreadyExistsError('Amazon S3 storage was already added to your project.');
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    const meta = stateManager.getMeta();

    if (storageRequest.serviceConfiguration.permissions.groups && !doUserPoolGroupsExist(meta)) {
      const error = new Error('No user pool groups found in amplify-meta.json.');
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    await createS3StorageArtifacts(context, storageRequest);
  } else if (storageRequest.serviceConfiguration.serviceName === ServiceName.DynamoDB) {
    const error = new Error('Headless support for DynamoDB resources is not yet implemented.');
    await context.usageData.emitError(error);
    error.stack = undefined;
    throw error;
  }
}

export async function headlessUpdateStorage(context: $TSContext, storageRequest: UpdateStorageRequest) {
  if (storageRequest.serviceModification.serviceName === ServiceName.S3) {
    const {
      serviceModification: { permissions, resourceName },
    } = storageRequest;

    const meta = stateManager.getMeta();
    const storageResource = meta[categoryName][resourceName];

    if (!storageResource || storageResource.service !== ServiceName.S3) {
      const error = new ResourceDoesNotExistError(`No S3 resource '${resourceName}' found in amplify-meta.json.`);
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    if (storageResource.mobileHubMigrated === true) {
      const error = new Error(`Updating storage resources migrated from mobile hub is not supported.`);
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    if (storageResource.serviceType === 'imported') {
      const error = new Error('Updating an imported storage resource is not supported.');
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    if (permissions.groups && !doUserPoolGroupsExist(meta)) {
      const error = new Error('No user pool groups found in amplify-meta.json.');
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    await updateS3StorageArtifacts(context, storageRequest, storageResource);
  } else if (storageRequest.serviceModification.serviceName === ServiceName.DynamoDB) {
    const error = new Error('Headless support for DynamoDB resources is not yet implemented.');
    await context.usageData.emitError(error);
    error.stack = undefined;
    throw error;
  }
}

export async function headlessImportStorage(context: $TSContext, storageRequest: ImportStorageRequest) {
  const {
    serviceConfiguration: { bucketName, serviceName },
  } = storageRequest;

  if (!checkIfAuthExists()) {
    const error = new Error(
      'Cannot headlessly import storage resource without an existing auth resource. It can be added with "amplify add auth"',
    );
    await context.usageData.emitError(error);
    error.stack = undefined;
    throw error;
  }

  if (storageRequest.serviceConfiguration.serviceName === ServiceName.S3) {
    if (resourceAlreadyExists()) {
      const error = new ResourceAlreadyExistsError('Amazon S3 storage was already added to your project.');
      await context.usageData.emitError(error);
      error.stack = undefined;
      throw error;
    }

    const serviceMetadata = ((await import('../supported-services')) as $TSAny).supportedServices[serviceName];
    const { provider } = serviceMetadata;

    const providerUtils = context.amplify.getPluginInstance(context, provider) as ProviderUtils;
    const s3 = await providerUtils.createS3Service(context);

    const bucketExists = await s3.bucketExists(bucketName);

    if (!bucketExists) {
      const error = new Error(`The specified bucket: "${bucketName}" does not exist.`);
      await context.usageData.emitError(error);
      throw error;
    }

    const bucketRegion = await s3.getBucketLocation(bucketName!);

    const projectConfig = context.amplify.getProjectConfig();
    const [shortId] = uuid().split('-');
    const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');
    const resourceName = `${projectName}${shortId}`;

    const questionParameters = {
      providerName: provider,
      bucketList: [],
      region: bucketRegion,
    };

    const answers = {
      resourceName,
      bucketName,
    };

    // As this is a resource add, we need to update environment specific parameters
    await updateStateFiles(context, questionParameters, answers, true);
  } else if (storageRequest.serviceConfiguration.serviceName === ServiceName.DynamoDB) {
    const error = new Error('Headless support for importing DynamoDB resources is not yet implemented.');
    await context.usageData.emitError(error);
    error.stack = undefined;
    throw error;
  }
}

export async function headlessRemoveStorage(context: $TSContext, storageRequest: RemoveStorageRequest) {
  const { resourceName, deleteBucketAndContents } = storageRequest.serviceConfiguration;

  if (deleteBucketAndContents === true) {
    throw new Error('deleteBucketAndContents is set to true, but the functionality is not yet implemented.');
  }

  try {
    await context.amplify.removeResource(context, categoryName, resourceName, { headless: true });
  } catch (error: $TSAny) {
    printer.error(`An error occurred when headlessly removing the storage resource "${resourceName}": ${error.message || error}`);

    await context.usageData.emitError(error);

    process.exitCode = 1;
  }
}

async function createS3StorageArtifacts(context: $TSContext, storageRequest: AddStorageRequest) {
  const storageInput: S3UserInputs  = buildS3UserInputFromHeadlessStorageRequest( context, storageRequest );
  const result = await s3CreateStorageResource(context, storageInput);
  const lambdaConfig = storageRequest.serviceConfiguration.lambdaTrigger;
  if(lambdaConfig){
    if (lambdaConfig.mode === 'new'){
      const storageLambdaParams: S3UserInputTriggerFunctionParams = buildTriggerFunctionParams(lambdaConfig.name)
      //create function and add as trigger
      await s3AddStorageLambdaTrigger(context,  storageInput.resourceName as string , storageLambdaParams)
    }
  }
}

async function updateS3StorageArtifacts(context: $TSContext, updateStorageRequest: UpdateStorageRequest, _storageResource: $TSAny) {
  const lambdaConfig = updateStorageRequest.serviceModification.lambdaTrigger;
  const storageInput: S3UserInputs = await buildS3UserInputFromHeadlessUpdateStorageRequest(context, updateStorageRequest);
  let s3UserInput = await s3UpdateUserInput(context, storageInput);
  if(lambdaConfig){
    if (lambdaConfig.mode === 'new'){
      const storageLambdaParams: S3UserInputTriggerFunctionParams = buildTriggerFunctionParams(lambdaConfig.name)
      //create function and add as trigger
      s3UserInput = await s3AddStorageLambdaTrigger(context,  storageInput.resourceName as string , storageLambdaParams)
    }
  }
  return s3UserInput;
}


function doUserPoolGroupsExist(meta: $TSMeta) {
  const { userPoolGroups } = meta[authCategoryName];
  return userPoolGroups && userPoolGroups.service === 'Cognito-UserPool-Groups';
}

export const checkIfAuthExists = () => {
  const amplifyMeta = stateManager.getMeta();
  let authExists = false;
  const authServiceName = 'Cognito';
  const authCategory = authCategoryName;

  if (amplifyMeta[authCategory] && Object.keys(amplifyMeta[authCategory]).length > 0) {
    const categoryResources = amplifyMeta[authCategory];

    Object.keys(categoryResources).forEach(resource => {
      if (categoryResources[resource].service === authServiceName) {
        authExists = true;
      }
    });
  }

  return authExists;
};

export async function getAuthResourceName(context: $TSContext) {
  let authResources = (await context.amplify.getResourceStatus(authCategoryName)).allResources;

  authResources = authResources.filter((resource: $TSAny) => resource.service === 'Cognito');

  if (authResources.length === 0) {
    throw new Error('No auth resource found. Please add it using amplify add auth');
  }

  return authResources[0].resourceName;
}

