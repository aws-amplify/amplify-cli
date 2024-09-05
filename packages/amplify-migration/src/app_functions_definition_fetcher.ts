import assert from 'node:assert';
import { FunctionDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { getFunctionDefinition } from '@aws-amplify/amplify-gen1-codegen-function-adapter';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { LambdaClient, GetFunctionCommand, FunctionConfiguration } from '@aws-sdk/client-lambda';
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
    const functions = meta?.function as Record<string, any>;

    console.log('functions -- ', functions);
    // const functionConfigurations: FunctionConfiguration[] = [];
    const getFunctionPromises = Object.keys(functions).map((key) => {
      const functionName = key;
      return this.lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName + '-' + backendEnvironment?.environmentName,
        }),
      );
    });

    const functionConfigurations = (await Promise.all(getFunctionPromises)).map(
      (functionResponse: { Configuration: any }) => functionResponse.Configuration!,
    );

    // if (configuration) {
    //     functionConfigurations.push(configuration);
    //   }

    console.log('functionConfigurations -- ', functionConfigurations);

    return getFunctionDefinition(functionConfigurations);
  };
}
