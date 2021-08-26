import { $TSAny, $TSContext, $TSObject, isResourceNameUnique, JSONUtilities, pathManager, stateManager } from 'amplify-cli-core';
import { AddStorageRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import * as path from 'path';
import { categoryName, ServiceName, storageParamsFilename } from '../../constants';
import { checkIfAuthExists } from './service-walkthroughs/s3-walkthrough';

// TODO where should this function actually go?
export async function headlessAddStorage(context: $TSContext, storageRequest: AddStorageRequest) {
  if (!checkIfAuthExists()) {
    throw new Error('Cannot headlessly add storage resource without an existing auth resource. It can be added with "amplify add auth"');
  }

  // create artifacts
  createStorageArtifacts(context, storageRequest.serviceConfiguration);
}

function createStorageArtifacts(context: $TSContext, parameters: AddStorageRequest['serviceConfiguration']) {
  if (isResourceNameUnique(categoryName, parameters.resourceName)) {
    const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, parameters.resourceName);
    fs.ensureDirSync(resourceDirPath);

    if (parameters.serviceName === ServiceName.S3) {
      // TODO
      // create parameters.json
      stateManager.setResourceParametersJson(undefined, categoryName, parameters.resourceName, {});
      // create storage-params.json
      writeToStorageParamsFile(parameters.resourceName, {});
      // create cfn
      // await copyCfnTemplate(context, categoryName, parameters.resourceName, {});
      // update meta
    } else if (parameters.serviceName === ServiceName.DynamoDB) {
      throw new Error('Headless support for DynamoDB resources is not yet implemented.');
    }
  }
}

export function readStorageParamsFileSafe(resourceName: string) {
  return JSONUtilities.readJson<$TSObject>(getStorageParamsFilePath(resourceName), { throwIfNotExist: false }) || {};
}

export function writeToStorageParamsFile(resourceName: string, storageParams: $TSAny) {
  JSONUtilities.writeJson(getStorageParamsFilePath(resourceName), storageParams);
}

function getStorageParamsFilePath(resourceName: string) {
  const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, resourceName);
  return path.join(resourceDirPath, storageParamsFilename);
}
