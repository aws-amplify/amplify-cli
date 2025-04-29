import assert from 'node:assert';
import { FunctionDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { getFunctionDefinition } from '@aws-amplify/amplify-gen1-codegen-function-adapter';
import { BackendEnvironmentResolver } from './backend_environment_selector';
import { GetFunctionCommand, GetPolicyCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeRuleCommand, CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import { StateManager } from '@aws-amplify/amplify-cli-core';

interface AuthConfig {
  dependsOn?: Array<{
    category: string;
    resourceName: string;
  }>;
  service: string;
  [key: string]: unknown;
}

export interface AppFunctionsDefinitionFetcher {
  getDefinition(): Promise<FunctionDefinition[] | undefined>;
}

export class AppFunctionsDefinitionFetcher {
  constructor(
    private lambdaClient: LambdaClient,
    private cloudWatchEventsClient: CloudWatchEventsClient,
    private backendEnvironmentResolver: BackendEnvironmentResolver,
    private stateManager: StateManager,
  ) {}

  getDefinition = async (): Promise<FunctionDefinition[] | undefined> => {
    const backendEnvironment = await this.backendEnvironmentResolver.selectBackendEnvironment();
    assert(backendEnvironment?.stackName);

    const meta = this.stateManager.getMeta();
    const functions = meta?.function ?? {};

    const auth = meta?.auth ?? {};
    const storageList = meta?.storage ?? {};

    const functionCategoryMap = new Map<string, string>();

    const authValues: AuthConfig | undefined = Object.values(auth).find(
      (resourceConfig: unknown) =>
        resourceConfig && typeof resourceConfig === 'object' && 'service' in resourceConfig && resourceConfig?.service === 'Cognito',
    ) as AuthConfig;

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
      return this.lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: meta.function[key].output.Name,
        }),
      );
    });

    const functionConfigurations = (await Promise.all(getFunctionPromises))
      .map((functionResponse) => functionResponse.Configuration ?? null)
      .filter((config): config is NonNullable<typeof config> => config !== null);

    // Fetch schedules for functions
    const getFunctionSchedulePromises = Object.keys(functions).map(async (key) => {
      const functionName = meta.function[key].output.Name;
      // Fetch the Lambda policy to get the CloudWatch rule name
      let ruleName: string | undefined;
      try {
        const policyResponse = await this.lambdaClient.send(new GetPolicyCommand({ FunctionName: functionName }));
        const policy = JSON.parse(policyResponse.Policy ?? '{}');
        ruleName = policy.Statement?.find((statement: any) => statement.Condition?.ArnLike?.['AWS:SourceArn']?.includes('rule/'))
          ?.Condition.ArnLike['AWS:SourceArn'].split('/')
          .pop();
      } catch (error) {
        return { functionName, scheduleExpression: undefined };
      }

      let scheduleExpression: string | undefined;

      if (ruleName) {
        // Use DescribeRuleCommand to get the schedule expression
        const ruleResponse = await this.cloudWatchEventsClient.send(new DescribeRuleCommand({ Name: ruleName }));
        scheduleExpression = ruleResponse.ScheduleExpression;
      }

      return {
        functionName,
        scheduleExpression,
      };
    });

    const functionSchedules = await Promise.all(getFunctionSchedulePromises);

    return getFunctionDefinition(functionConfigurations, functionSchedules, functionCategoryMap, meta);
  };
}
