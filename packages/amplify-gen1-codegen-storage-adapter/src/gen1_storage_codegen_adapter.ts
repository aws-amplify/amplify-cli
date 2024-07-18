import { StorageRenderParameters } from '@aws-amplify/amplify-gen2-codegen';
import { StorageCLIInputsJSON, getStorageAccess } from './storage_access';

export type StorageInputs = {
  bucketName: string;
  cliInputs: StorageCLIInputsJSON;
};
export const getStorageDefinition = ({ bucketName, cliInputs }: StorageInputs): StorageRenderParameters => {
  return {
    accessPatterns: getStorageAccess(cliInputs),
    storageIdentifier: bucketName,
  };
};
