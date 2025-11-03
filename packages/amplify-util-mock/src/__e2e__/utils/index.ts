import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import * as openSearchEmulator from '@aws-amplify/amplify-opensearch-simulator';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 } from 'uuid';
import _ from 'lodash';
import { processTransformerStacks } from '../../CFNParser/appsync-resource-processor';
import { configureDDBDataSource, createAndUpdateTable } from '../../utils/dynamo-db';
import { getFunctionDetails } from './lambda-helper';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { functionRuntimeContributorFactory } from 'amplify-nodejs-function-runtime-provider';
import { querySearchable } from '../../utils/opensearch';
import { isWindowsPlatform } from '@aws-amplify/amplify-cli-core';

const invoke = functionRuntimeContributorFactory({}).invoke;

export * from './graphql-client';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as {}),
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../amplify-dynamodb-simulator'),
    getAmplifyLibRoot: jest.fn().mockReturnValue(''),
  },
}));

export async function launchDDBLocal() {
  let dbPath;
  while (true) {
    dbPath = path.join('/tmp', `amplify-cli-emulator-dynamodb-${v4()}`);
    if (!fs.existsSync(dbPath)) break;
  }

  fs.ensureDirSync(dbPath);
  const emulator = await dynamoEmulator.launch({
    dbPath,
    port: null,
  });
  const client: DynamoDBClient = await dynamoEmulator.getClient(emulator);
  logDebug(dbPath);
  return { emulator, dbPath, client };
}

export async function deploy(
  transformerOutput: any,
  client?: DynamoDBClient,
  opensearchURL?: URL,
): Promise<{ config: any; simulator: AmplifyAppSyncSimulator }> {
  let config: any = processTransformerStacks(transformerOutput);
  config.appSync.apiKey = 'da-fake-api-key';

  if (client) {
    await createAndUpdateTable(client, config);
    config = await configureDDBDataSource(config, client.config);
  }
  await configureLambdaDataSource(config);
  if (opensearchURL) {
    config = await configureOpensearchDataSource(config, opensearchURL);
  }
  const simulator = await runAppSyncSimulator(config);
  return { simulator, config };
}

export async function reDeploy(
  transformerOutput: any,
  simulator: AmplifyAppSyncSimulator,
  client?: DynamoDBClient,
): Promise<{ config: any; simulator: AmplifyAppSyncSimulator }> {
  let config: any = processTransformerStacks(transformerOutput);
  config.appSync.apiKey = 'da-fake-api-key';

  if (client) {
    await createAndUpdateTable(client, config);
    config = await configureDDBDataSource(config, client.config);
  }
  await configureLambdaDataSource(config);
  simulator?.reload(config);
  return { simulator, config };
}

async function configureLambdaDataSource(config) {
  config.dataSources
    .filter((d) => d.type === 'AWS_LAMBDA')
    .forEach((d) => {
      const arn = d.LambdaFunctionArn;
      const arnParts = arn.split(':');
      const functionName = arnParts[arnParts.length - 1];
      const lambdaConfig = getFunctionDetails(functionName);
      d.invoke = (payload) => {
        logDebug('Invoking lambda with config', lambdaConfig);
        return invoke({
          srcRoot: lambdaConfig.packageFolder,
          runtime: 'nodejs',
          handler: `${functionName}.${lambdaConfig.handler}`,
          event: JSON.stringify(payload),
        });
      };
    });
  return config;
}

async function configureOpensearchDataSource(config, opensearchURL) {
  if (isWindowsPlatform()) {
    return config;
  }
  const opensearchDataSourceType = 'AMAZON_ELASTICSEARCH';
  const opensearchDataSources = config.dataSources.filter((d) => d.type === opensearchDataSourceType);
  if (_.isEmpty(opensearchDataSources)) {
    return config;
  }
  return {
    ...config,
    dataSources: await Promise.all(
      config.dataSources.map(async (d) => {
        if (d.type !== opensearchDataSourceType) {
          return d;
        }
        return {
          ...d,
          invoke: async (payload) => {
            return await querySearchable(opensearchURL, payload);
          },
        };
      }),
    ),
  };
}

export async function terminateDDB(emulator, dbPath) {
  try {
    if (emulator && emulator.terminate) {
      await emulator.terminate();
    }
  } catch (e) {
    logDebug('Failed to terminate the Local DynamoDB Server', e);
  }
  try {
    fs.removeSync(dbPath);
  } catch (e) {
    logDebug('Failed delete Local DynamoDB Server Folder', e);
  }
}

export async function runAppSyncSimulator(config, port?: number, wsPort?: number): Promise<AmplifyAppSyncSimulator> {
  const appsyncSimulator = new AmplifyAppSyncSimulator({ port, wsPort });
  await appsyncSimulator.start();
  await appsyncSimulator.init(config);
  return appsyncSimulator;
}

export function logDebug(...msgs) {
  if (process.env.DEBUG || process.env.CI) {
    console.log(...msgs);
  }
}

export async function setupSearchableMockResources(
  pathToSearchableMockResources: string,
): Promise<{ emulator: openSearchEmulator.OpenSearchEmulator }> {
  const pathToSearchableTrigger = path.join(pathToSearchableMockResources, 'searchable-lambda-trigger');
  fs.ensureDirSync(pathToSearchableTrigger);

  const searchableLambdaResourceDir = path.resolve(__dirname, '..', '..', '..', 'resources', 'mock-searchable-lambda-trigger');
  fs.copySync(searchableLambdaResourceDir, pathToSearchableTrigger, { overwrite: true });

  const pathToOpensearchLocal = path.join(
    pathToSearchableMockResources,
    openSearchEmulator.packageName,
    openSearchEmulator.relativePathToOpensearchLocal,
  );
  fs.ensureDirSync(pathToOpensearchLocal);
  const pathToOpensearchData = path.join(pathToSearchableMockResources, 'searchable-data');
  fs.ensureDirSync(pathToOpensearchData);

  const emulator = await openSearchEmulator.launch(pathToOpensearchData, {
    port: null,
  });

  return { emulator };
}
