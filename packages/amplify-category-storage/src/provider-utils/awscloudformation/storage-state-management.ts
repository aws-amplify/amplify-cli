import { $TSAny, $TSObject, JSONUtilities, pathManager } from 'amplify-cli-core';
import * as path from 'path';

import { categoryName, storageParamsFilename } from '../../constants';

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
