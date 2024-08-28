import assert from 'node:assert';
import path from 'node:path';
import { getStorageDefinition } from '@aws-amplify/amplify-gen1-codegen-storage-adapter';
import { BackendDownloader } from './backend_downloader.js';
import { StorageRenderParameters } from '@aws-amplify/amplify-gen2-codegen';
import { GetBucketNotificationConfigurationCommand, S3Client } from '@aws-sdk/client-s3';
import { BackendEnvironmentResolver } from './backend_environment_selector.js';
import { readJsonFile, fileOrDirectoryExists } from './file_utils.js';

export interface AppStorageDefinitionFetcher {
  getDefinition(): Promise<ReturnType<typeof getStorageDefinition> | undefined>;
}
export class AppStorageDefinitionFetcher {
  constructor(
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private ccbFetcher: BackendDownloader,
    private s3Client: S3Client,
  ) {}

  getDefinition = async (): Promise<StorageRenderParameters | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.deploymentArtifacts);
    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    assert(await fileOrDirectoryExists(amplifyMetaPath), 'Could not find amplify-meta.json');

    const amplifyMeta = (await readJsonFile(amplifyMetaPath)) ?? {};
    if ('storage' in amplifyMeta && Object.keys(amplifyMeta.storage).length) {
      const storageName = Object.keys(amplifyMeta.storage)[0];
      const cliInputsPath = path.join(currentCloudBackendDirectory, 'storage', storageName, 'cli-inputs.json');
      assert(await fileOrDirectoryExists(cliInputsPath));
      const cliInputs = await readJsonFile(cliInputsPath);
      const bucketName = amplifyMeta.storage[storageName].output.BucketName;
      assert(bucketName);
      const triggers = await this.s3Client.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
      console.log(triggers);
      const storageOptions = getStorageDefinition({
        cliInputs,
        bucketName,
      });
      return storageOptions;
    }
    return undefined;
  };
}
