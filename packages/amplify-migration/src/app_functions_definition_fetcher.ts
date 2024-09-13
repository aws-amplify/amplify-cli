import assert from 'node:assert';
import { FunctionDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { getFunctionDefinition } from '@aws-amplify/amplify-gen1-codegen-function-adapter';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { StateManager } from '@aws-amplify/amplify-cli-core';

export interface AppFunctionsDefinitionFetcher {
  getDefinition(): Promise<FunctionDefinition[] | undefined>;
}

export class AppFunctionsDefinitionFetcher {
  constructor(
    private lambdaClient: LambdaClient,
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private stateManager: StateManager,
  ) {}

  getDefinition = async (): Promise<FunctionDefinition[] | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const meta = this.stateManager.getMeta();
    const functions = meta?.function ?? {};

    const auth = meta?.auth;
    const storageList = meta?.storage ?? {};

    const functionCategoryMap = new Map<string, string>();

    const authValues: any = Object.values(auth)[0];

    // auth triggers
    if (auth && authValues && authValues.dependsOn) {
      for (const env of authValues.dependsOn) {
        if (env.category == 'function') {
          functionCategoryMap.set(env.resourceName, 'auth');
        }
      }
    }

    // s3 storage trigger
    Object.keys(storageList).forEach((storage) => {
      const storageObj = storageList[storage];
      if (storageObj.dependsOn) {
        for (const env of storageObj.dependsOn) {
          if (env.category == 'function') {
            functionCategoryMap.set(env.resourceName, 'storage');
          }
        }
      }
    });

    // dynamodb storage trigger
    Object.keys(functions).forEach((func) => {
      const funcObj = functions[func];
      if (funcObj.dependsOn) {
        for (const env of funcObj.dependsOn) {
          if (env.category == 'storage') {
            functionCategoryMap.set(func, 'storage');
          }
        }
      }
    });

    const getFunctionPromises = Object.keys(functions).map((key) => {
      const functionName = key;
      return this.lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName + '-' + backendEnvironment?.environmentName,
        }),
      );
    });

    const functionConfigurations = (await Promise.all(getFunctionPromises)).map((functionResponse) => functionResponse.Configuration!);

    return getFunctionDefinition(functionConfigurations, functionCategoryMap);
  };
}
