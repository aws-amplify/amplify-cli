import path from 'path';
import uuid from 'uuid';
import fs from 'fs-extra';
import { amplifyPush, addFunction, addApi } from 'amplify-e2e-core';

import { configureAmplify, getApiKey, getConfiguredAppsyncClientAPIKeyAuth } from './authHelper';

import { updateSchemaInTestProject, testQueries } from './common';

export async function runFunctionTest(projectDir: string, testModule: any) {
  const functionName = await addSimpleFunction(projectDir, testModule, 'func');
  await addApi(projectDir);
  updateSchemaInTestProject(projectDir, testModule.schema);
  updateFunctionNameInSchema(projectDir, '<function-name>', functionName);
  await amplifyPush(projectDir);

  const awsconfig = configureAmplify(projectDir);
  const apiKey = getApiKey(projectDir);
  const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

  await testQueries(testModule, appSyncClient);
}

export async function addSimpleFunction(projectDir: string, testModule: any, funcName: string): Promise<string> {
  const functionName = randomizedFunctionName(funcName);
  await addFunction(
    projectDir,
    {
      name: functionName,
      functionTemplate: 'Hello World',
    },
    'nodejs',
  );

  const amplifyBackendDirPath = path.join(projectDir, 'amplify', 'backend');
  const amplifyFunctionIndexFilePath = path.join(amplifyBackendDirPath, 'function', functionName, 'src', 'index.js');

  fs.writeFileSync(amplifyFunctionIndexFilePath, testModule[funcName]);

  return functionName;
}

export function randomizedFunctionName(functionName: string) {
  functionName = functionName.toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid().split('-');
  return `${functionName}${shortId}`;
}

export function updateFunctionNameInSchema(projectDir: string, functionNamePlaceHolder: string, functionName: string) {
  const backendApiDirPath = path.join(projectDir, 'amplify', 'backend', 'api');
  const apiResDirName = fs.readdirSync(backendApiDirPath)[0];
  const amplifySchemaFilePath = path.join(backendApiDirPath, apiResDirName, 'schema.graphql');

  let amplifySchemaFileContents = fs.readFileSync(amplifySchemaFilePath).toString();
  const placeHolderRegex = new RegExp(functionNamePlaceHolder, 'g');
  amplifySchemaFileContents = amplifySchemaFileContents.replace(placeHolderRegex, functionName);
  fs.writeFileSync(amplifySchemaFilePath, amplifySchemaFileContents);
}
