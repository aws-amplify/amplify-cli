import { AmplifyAppSyncSimulator } from 'amplify-appsync-simulator';
import { ensureDynamoDBTables, configureDDBDataSource } from '../../utils/ddb-utils';
import { processAppSyncResources } from '../../CFNParser';
import * as dynamoEmulator from 'amplify-dynamodb-simulator';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getFunctionDetails } from './lambda-helper';
import { invoke } from '../../utils/lambda/invoke';

export async function launchDDBLocal() {
  let dbPath;
  while (true) {
    dbPath = path.join('/tmp', `amplify-cli-emulator-dynamodb-${Math.floor(Math.random() * 100)}`);
    if (!fs.existsSync(dbPath)) break;
  }

  fs.ensureDirSync(dbPath);
  const emulator = await dynamoEmulator.launch({
    dbPath,
    port: null,
  });
  const client = await dynamoEmulator.getClient(emulator);
  return { emulator, dbPath, client };
}

export async function deploy(transformerOutput: any, client = null) {
  const stacks = Object.values(transformerOutput.stacks).reduce(
    (prev, stack: any) => {
      return { ...prev, ...stack.Resources };
    },
    { ...transformerOutput.rootStack.Resources }
  );

  let config: any = processAppSyncResources(stacks, transformerOutput);
  if (config.appSync.authenticationType == 'API_KEY' && !config.appSync.apiKey) {
    // transformer generates API Key only if AuthTransformer is included
    config.appSync.apiKey = 'da-fake-api-key';
  }
  if (client) {
    await ensureDynamoDBTables(client, config);
    config = configureDDBDataSource(config, client.config);
  }
  configureLambdaDataSource(config);
  const simulator = await runAppSyncSimulator(config);
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
          ...lambdaConfig,
          event: payload,
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
    console.log('Failed to terminate the Local DynamoDB Server', e);
  }
  try {
    fs.removeSync(dbPath);
  } catch (e) {
    console.log('Failed delete Local DynamoDB Server Folder', e);
  }
}

export async function runAppSyncSimulator(config, port?: number, wsPort?: number) {
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
