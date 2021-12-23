import { AmplifyAppSyncSimulator } from 'amplify-appsync-simulator';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 } from 'uuid';
import { processTransformerStacks } from '../../CFNParser/appsync-resource-processor';
import { configureDDBDataSource, createAndUpdateTable } from '../../utils/dynamo-db';
import { getFunctionDetails } from './lambda-helper';
import { DynamoDB } from 'aws-sdk';
import { functionRuntimeContributorFactory } from 'amplify-nodejs-function-runtime-provider';

const invoke = functionRuntimeContributorFactory({}).invoke;

export * from './graphql-client';

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getAmplifyPackageLibDirPath: jest.fn().mockReturnValue('../amplify-dynamodb-simulator'),
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
  const client: DynamoDB = await dynamoEmulator.getClient(emulator);
  logDebug(dbPath);
  return { emulator, dbPath, client };
}

export async function deploy(transformerOutput: any, client?: DynamoDB): Promise<{ config: any; simulator: AmplifyAppSyncSimulator }> {
  let config: any = processTransformerStacks(transformerOutput);
  config.appSync.apiKey = 'da-fake-api-key';

  if (client) {
    await createAndUpdateTable(client, config);
    config = configureDDBDataSource(config, client.config);
  }
  configureLambdaDataSource(config);
  const simulator = await runAppSyncSimulator(config);
  return { simulator, config };
}

export async function reDeploy(
  transformerOutput: any,
  simulator: AmplifyAppSyncSimulator,
  client?: DynamoDB,
): Promise<{ config: any; simulator: AmplifyAppSyncSimulator }> {
  let config: any = processTransformerStacks(transformerOutput);
  config.appSync.apiKey = 'da-fake-api-key';

  if (client) {
    await createAndUpdateTable(client, config);
    config = configureDDBDataSource(config, client.config);
  }
  configureLambdaDataSource(config);
  simulator?.reload(config);
  return { simulator, config };
}

async function configureLambdaDataSource(config) {
  config.dataSources
    .filter(d => d.type === 'AWS_LAMBDA')
    .forEach(d => {
      const arn = d.LambdaFunctionArn;
      const arnParts = arn.split(':');
      let functionName = arnParts[arnParts.length - 1];
      const lambdaConfig = getFunctionDetails(functionName);
      d.invoke = payload => {
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
