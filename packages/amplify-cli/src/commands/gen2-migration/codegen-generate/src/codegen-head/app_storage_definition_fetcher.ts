import fs from 'node:fs/promises';
import path from 'node:path';
import { getStorageDefinition, DynamoDBTableDefinition, DynamoDBAttribute, DynamoDBGSI } from '../adapters/storage/index';
import { BackendDownloader } from './backend_downloader';
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
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { DynamoDBClient, DescribeTableCommand } from '@aws-sdk/client-dynamodb';

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
    private dynamoClient: DynamoDBClient = new DynamoDBClient({}),
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

  // Check the properties
  private parseDynamoDBTable = async (
    storageName: string,
    currentCloudBackendDirectory: string,
    storageOutput: StorageOutput,
  ): Promise<DynamoDBTableDefinition> => {
    const cliInputsPath = path.join(currentCloudBackendDirectory, 'storage', storageName, 'cli-inputs.json');
    const cliInputs = await this.readJsonFile(cliInputsPath);

    const tableName = cliInputs.tableName || storageName;
    const partitionKey: DynamoDBAttribute = {
      name: cliInputs.partitionKey?.name || 'id',
      type: this.mapAttributeType(cliInputs.partitionKey?.type || 'S'),
    };

    let sortKey: DynamoDBAttribute | undefined;
    if (cliInputs.sortKey) {
      sortKey = {
        name: cliInputs.sortKey.name,
        type: this.mapAttributeType(cliInputs.sortKey.type),
      };
    }

    const gsis: DynamoDBGSI[] = [];
    if (cliInputs.gsi) {
      cliInputs.gsi.forEach(
        (gsi: { name: string; partitionKey: { name: string; type: string }; sortKey?: { name: string; type: string } }) => {
          const gsiDef: DynamoDBGSI = {
            indexName: gsi.name,
            partitionKey: {
              name: gsi.partitionKey.name,
              type: this.mapAttributeType(gsi.partitionKey.type),
            },
          };
          if (gsi.sortKey) {
            gsiDef.sortKey = {
              name: gsi.sortKey.name,
              type: this.mapAttributeType(gsi.sortKey.type),
            };
          }
          gsis.push(gsiDef);
        },
      );
    }

    const lambdaPermissions = this.findLambdaPermissions(tableName);

    // Fetch current table configuration from AWS
    const currentConfig: {
      billingMode: 'PROVISIONED' | 'PAY_PER_REQUEST';
      readCapacity: number;
      writeCapacity: number;
      streamEnabled: boolean;
      streamViewType: string | undefined;
    } = {
      billingMode: 'PROVISIONED',
      readCapacity: 5,
      writeCapacity: 5,
      streamEnabled: false,
      streamViewType: undefined,
    };

    try {
      const actualTableName = storageOutput.output?.Name || tableName;
      const describeResult = await this.dynamoClient.send(new DescribeTableCommand({ TableName: actualTableName }));
      const table = describeResult.Table;

      if (table) {
        currentConfig.billingMode = table.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' ? 'PAY_PER_REQUEST' : 'PROVISIONED';
        currentConfig.readCapacity = table.ProvisionedThroughput?.ReadCapacityUnits || 5;
        currentConfig.writeCapacity = table.ProvisionedThroughput?.WriteCapacityUnits || 5;
        currentConfig.streamEnabled = !!table.StreamSpecification?.StreamEnabled;
        currentConfig.streamViewType = table.StreamSpecification?.StreamViewType;
      }
    } catch (e) {
      // Use defaults if table doesn't exist or can't be accessed
    }

    return {
      tableName,
      partitionKey,
      sortKey,
      gsis: gsis.length > 0 ? gsis : undefined,
      lambdaPermissions: lambdaPermissions.length > 0 ? lambdaPermissions : undefined,
      billingMode: currentConfig.billingMode,
      readCapacity: currentConfig.readCapacity,
      writeCapacity: currentConfig.writeCapacity,
      streamEnabled: currentConfig.streamEnabled,
      streamViewType: currentConfig.streamViewType as 'KEYS_ONLY' | 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | undefined,
    };
  };

  private mapAttributeType = (dynamoType: string): 'STRING' | 'NUMBER' | 'BINARY' => {
    switch (dynamoType) {
      case 'S':
        return 'STRING';
      case 'N':
        return 'NUMBER';
      case 'B':
        return 'BINARY';
      default:
        return 'STRING';
    }
  };

  // Understand how this works
  private findLambdaPermissions = (tableName: string) => {
    const permissions: { functionName: string; envVarName: string }[] = [];
    const meta = stateManager.getMeta();

    if (meta.function) {
      Object.entries(meta.function).forEach(([functionName]: [string, unknown]) => {
        const functionInputs = stateManager.getResourceInputsJson(undefined, 'function', functionName);
        if (functionInputs?.environmentVariables) {
          Object.entries(functionInputs.environmentVariables).forEach(([envVar, value]: [string, unknown]) => {
            if (typeof value === 'string' && value.includes(tableName)) {
              permissions.push({
                functionName,
                envVarName: envVar,
              });
            }
          });
        }
      });
    }

    return permissions;
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
    const dynamoTables: DynamoDBTableDefinition[] = [];

    if ('storage' in amplifyMeta && Object.keys(amplifyMeta.storage).length) {
      for (const [storageName, storage] of Object.entries(amplifyMeta.storage)) {
        const cliInputsPath = path.join(currentCloudBackendDirectory, 'storage', storageName, 'cli-inputs.json');

        if (!(await fileOrDirectoryExists(cliInputsPath))) {
          throw new Error(`Could not find cli-inputs.json for ${storageName}`);
        }

        const storageOutput = storage as StorageOutput;

        if (storageOutput.service === 'S3') {
          const cliInputs = await this.readJsonFile(cliInputsPath);
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
          const tableDefinition = await this.parseDynamoDBTable(storageName, currentCloudBackendDirectory, storageOutput);
          dynamoTables.push(tableDefinition);
        }
      }
    }

    if (dynamoTables.length > 0) {
      if (!storageOptions) storageOptions = {};
      storageOptions.dynamoTables = dynamoTables;
    }

    return storageOptions;
  };
}
