//special handling needed becasue we need to set up the function in a differnt region
import path from 'path';
import fs from 'fs-extra';

import {
  getProjectMeta,
  deleteProject,
  deleteProjectDir,
  addApi,
  amplifyPush,
  amplifyPushWithoutCodegen,
  addFunction,
  initProjectWithAccessKey,
} from 'amplify-e2e-core';

import { getApiKey, configureAmplify, getConfiguredAppsyncClientAPIKeyAuth } from '../authHelper';

import { updateSchemaInTestProject, testQueries } from '../common';

import { randomizedFunctionName } from '../functionTester';

export async function runTest(projectDir: string, testModule: any) {
  const functionRegion = process.env.CLI_REGION === 'us-west-2' ? 'us-east-1' : 'us-west-2';
  const functionProjectDirPath = path.join(path.dirname(projectDir), path.basename(projectDir) + '-function');

  try {
    const functionName = await setupFunction(functionProjectDirPath, functionRegion);

    await addApi(projectDir);
    updateSchemaInTestProject(projectDir, testModule.schema);

    updateFunctionNameAndRegionInSchema(projectDir, functionName, functionRegion);
    await amplifyPush(projectDir);

    const awsconfig = configureAmplify(projectDir);
    const apiKey = getApiKey(projectDir);
    const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

    await testQueries(testModule, appSyncClient);
  } catch (e) {
    throw e;
  } finally {
    await deleteFunctionProject(functionProjectDirPath);
  }
}

async function setupFunction(functionProjectDirPath: string, functionRegion: string): Promise<string> {
  fs.ensureDirSync(functionProjectDirPath);
  await initProjectWithAccessKey(functionProjectDirPath, {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: functionRegion,
  });

  const functionName = randomizedFunctionName('function');
  await addFunction(
    functionProjectDirPath,
    {
      name: functionName,
      functionTemplate: 'Hello World',
    },
    'nodejs',
  );

  const amplifyBackendDirPath = path.join(functionProjectDirPath, 'amplify', 'backend');
  const amplifyFunctionIndexFilePath = path.join(amplifyBackendDirPath, 'function', functionName, 'src', 'index.js');

  fs.writeFileSync(amplifyFunctionIndexFilePath, func);

  await amplifyPushWithoutCodegen(functionProjectDirPath);

  const amplifyMeta = getProjectMeta(functionProjectDirPath);

  //return the actual function name in the other region
  return amplifyMeta.function[functionName].output.Name;
}

async function deleteFunctionProject(functionProjectDirPath: string) {
  await deleteProject(functionProjectDirPath);
  deleteProjectDir(functionProjectDirPath);
}

function updateFunctionNameAndRegionInSchema(projectDir: string, functionName: string, functionRegion: string) {
  const backendApiDirPath = path.join(projectDir, 'amplify', 'backend', 'api');
  const apiResDirName = fs.readdirSync(backendApiDirPath)[0];
  const amplifySchemaFilePath = path.join(backendApiDirPath, apiResDirName, 'schema.graphql');

  let amplifySchemaFileContents = fs.readFileSync(amplifySchemaFilePath).toString();

  amplifySchemaFileContents = amplifySchemaFileContents.replace(/<function-name>/g, functionName);
  amplifySchemaFileContents = amplifySchemaFileContents.replace(/<function-region>/g, functionRegion);

  fs.writeFileSync(amplifySchemaFilePath, amplifySchemaFileContents);
}

//schema
export const schema = `
#change: replace the dummy function name with  "<function-name>" placeholder, the test will replace it with the actual function name
#change: replaced the dummy region "us-east-1" with the  "<function-region>" placeholder, the test will replace is with the actual region of the function
type Query {
  echo(msg: String): String @function(name: "<function-name>", region: "<function-region>")
}
`;

//functions
export const func = `
//#extra
//create the lambda function in region other than the amplify project region
exports.handler = async event => {
  return event.arguments.msg;
};
`;

//queries
export const query = `
#extra
query Echo {
  echo(msg: "query message echoed from different region.")
}
`;
export const expected_result_query = {
  data: {
    echo: 'query message echoed from different region.',
  },
};
