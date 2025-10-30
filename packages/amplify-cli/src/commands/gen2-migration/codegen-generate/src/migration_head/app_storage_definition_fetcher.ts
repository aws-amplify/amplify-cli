import fs from 'node:fs/promises';
import path from 'node:path';
import { getStorageDefinition } from '../adapters/storage/index';
import { BackendDownloader } from './backend_downloader.js';
import { StorageRenderParameters, StorageTriggerEvent, Lambda, ServerSideEncryptionConfiguration } from '../core/migration-pipeline';
import {
  GetBucketNotificationConfigurationCommand,
  S3Client,
  GetBucketNotificationConfigurationCommandOutput,
  GetBucketAccelerateConfigurationCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { fileOrDirectoryExists } from './directory_exists';

export interface AppStorageDefinitionFetcher {
  getDefinition(): Promise<ReturnType<typeof getStorageDefinition> | undefined>;
}

interface StorageOutput {
  service: string;
  output: {
    Name?: string;
    BucketName?: string;
  };
}

export class AppStorageDefinitionFetcher {
  constructor(
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private ccbFetcher: BackendDownloader,
    private s3Client: S3Client,
  ) {}
  private readJsonFile = async (filePath: string) => {
    const contents = await fs.readFile(filePath, { encoding: 'utf8' });
    return JSON.parse(contents);
  };
  private getFunctionPath = (functionName: string) => {
    return path.join('amplify', 'backend', 'function', functionName, 'src');
  };
  private getStorageTriggers = (
    connections: GetBucketNotificationConfigurationCommandOutput,
  ): Partial<Record<StorageTriggerEvent, Lambda>> => {
    const triggers: Partial<Record<StorageTriggerEvent, Lambda>> = {};
    const lambdaFunctionConfigurations = connections.LambdaFunctionConfigurations || [];
    for (const connection of lambdaFunctionConfigurations) {
      const functionName = connection.LambdaFunctionArn ? connection.LambdaFunctionArn.split(':').pop()?.split('-')[0] : '';
      const event = connection.Events ? connection.Events[0] : '';

      if (event.includes('ObjectCreated') && functionName) {
        triggers['onUpload' as StorageTriggerEvent] = { source: this.getFunctionPath(functionName) } as Lambda;
      } else if (event.includes('ObjectRemoved') && functionName) {
        triggers['onDelete' as StorageTriggerEvent] = { source: this.getFunctionPath(functionName) } as Lambda;
      }
    }

    return triggers;
  };

  getDefinition = async (): Promise<StorageRenderParameters | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    if (!backendEnvironment?.deploymentArtifacts) return undefined;

    const currentCloudBackendDirectory = await this.ccbFetcher.getCurrentCloudBackend(backendEnvironment.deploymentArtifacts);

    const amplifyMetaPath = path.join(currentCloudBackendDirectory, 'amplify-meta.json');

    if (!(await fileOrDirectoryExists(amplifyMetaPath))) {
      throw new Error('Could not find amplify-meta.json');
    }

    const amplifyMeta = (await this.readJsonFile(amplifyMetaPath)) ?? {};
    let storageOptions: StorageRenderParameters | undefined = undefined;

    if ('storage' in amplifyMeta && Object.keys(amplifyMeta.storage).length) {
      for (const [storageName, storage] of Object.entries(amplifyMeta.storage)) {
        const cliInputsPath = path.join(currentCloudBackendDirectory, 'storage', storageName, 'cli-inputs.json');

        if (!(await fileOrDirectoryExists(cliInputsPath))) {
          throw new Error(`Could not find cli-inputs.json for ${storageName}`);
        }

        const cliInputs = await this.readJsonFile(cliInputsPath);
        const storageOutput = storage as StorageOutput;
        if (storageOutput.service === 'S3') {
          const bucketName = storageOutput.output.BucketName;
          if (!bucketName) throw new Error('Could not find bucket name');

          const connections = await this.s3Client.send(new GetBucketNotificationConfigurationCommand({ Bucket: bucketName }));
          const { Status: accelerateConfiguration } = await this.s3Client.send(
            new GetBucketAccelerateConfigurationCommand({ Bucket: bucketName }),
          );
          const { Status: versioningConfiguration } = await this.s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));

          const { ServerSideEncryptionConfiguration: serverSideEncryptionByDefault } = await this.s3Client.send(
            new GetBucketEncryptionCommand({ Bucket: bucketName }),
          );

          const triggers = this.getStorageTriggers(connections);

          const storageDefinition = getStorageDefinition({
            cliInputs,
            bucketName,
            triggers,
          });

          if (!storageOptions) storageOptions = {};
          storageOptions.accessPatterns = storageDefinition.accessPatterns;
          storageOptions.storageIdentifier = storageDefinition.storageIdentifier;
          storageOptions.triggers = storageDefinition.triggers;
          storageOptions.accelerateConfiguration = accelerateConfiguration;
          storageOptions.versioningConfiguration = versioningConfiguration;
          storageOptions.bucketName = bucketName;

          if (serverSideEncryptionByDefault && serverSideEncryptionByDefault.Rules && serverSideEncryptionByDefault.Rules[0]) {
            const serverSideEncryptionConf: ServerSideEncryptionConfiguration = {
              serverSideEncryptionByDefault: serverSideEncryptionByDefault.Rules[0].ApplyServerSideEncryptionByDefault!,
              bucketKeyEnabled: serverSideEncryptionByDefault.Rules[0].BucketKeyEnabled!,
            };

            storageOptions.bucketEncryptionAlgorithm = serverSideEncryptionConf;
          }
        } else if (storageOutput.service === 'DynamoDB') {
          const tableName = storageOutput.output.Name?.split('-')[0];
          if (!tableName) throw new Error('Could not find table name');

          if (!storageOptions) storageOptions = {};
          storageOptions.dynamoDB = tableName;
        }
      }
    }
    return storageOptions;
  };
}
