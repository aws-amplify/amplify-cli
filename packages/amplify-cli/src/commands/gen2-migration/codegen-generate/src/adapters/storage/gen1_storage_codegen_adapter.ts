import { StorageTriggerEvent, Lambda, StorageRenderParameters } from '../../core/migration-pipeline';
import { StorageCLIInputsJSON, getStorageAccess } from './storage_access';

export type StorageInputs = {
  bucketName: string;
  cliInputs: StorageCLIInputsJSON;
  triggers?: Partial<Record<StorageTriggerEvent, Lambda>>;
};
export const getStorageDefinition = ({ bucketName, cliInputs, triggers }: StorageInputs): StorageRenderParameters => {
  return {
    accessPatterns: getStorageAccess(cliInputs),
    storageIdentifier: bucketName,
    triggers: triggers ?? {},
  };
};
