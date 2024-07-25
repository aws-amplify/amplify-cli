import fs from 'node:fs/promises';
import assert from 'node:assert';
import path from 'node:path';
import { getStorageDefinition } from '@aws-amplify/amplify-gen1-codegen-storage-adapter';
import { BackendDownloader } from './backend_downloader.js';
import { fileOrDirectoryExists } from './directory_exists.js';
import { StorageRenderParameters } from '@aws-amplify/amplify-gen2-codegen';
import { GetBucketNotificationConfigurationCommand, S3Client } from '@aws-sdk/client-s3';

export interface AppStorageDefinitionFetcher {
  getDefinition(deploymentBucket: string): Promise<ReturnType<typeof getStorageDefinition> | undefined>;
}
export class AppStorageDefinitionFetcher {
  constructor(private ccbFetcher: BackendDownloader, private s3Client: S3Client) {}
  private readJsonFile = async (filePath: string) => {
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents);
  };
  getDefinition = async (deploymentBucket: string): Promise<StorageRenderParameters | undefined> => {
    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(deploymentBucket);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    assert(await fileOrDirectoryExists(amplifyMetaPath), 'Could not find amplify-meta.json');

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};
    if ('storage' in amplifyMeta && Object.keys(amplifyMeta.storage).length) {
      const storageName = Object.keys(amplifyMeta.storage)[0];
      const cliInputsPath = path.join(currentCloudBackendDirectory, 'storage', storageName, 'cli-inputs.json');
      assert(await fileOrDirectoryExists(cliInputsPath));
      const cliInputs = await this.readJsonFile(cliInputsPath);
      assert(cliInputs.bucketName);
      const { bucketName } = cliInputs;
      console.log(bucketName);
      const triggers = await this.s3Client.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
      console.log('triggers', triggers);
      const storageOptions = getStorageDefinition({
        cliInputs,
        bucketName: bucketName,
      });
      return storageOptions;
    }
    return undefined;
  };
}
