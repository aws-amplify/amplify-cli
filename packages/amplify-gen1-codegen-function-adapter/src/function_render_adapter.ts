import { FunctionDefinition } from '@aws-amplify/amplify-gen2-codegen';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';
import assert from 'node:assert';

type AmplifyMetaFunction = {
  service: 'Cognito';
  providerPlugin: 'awscloudformation';
  output: Record<string, string>;
};

type AmplifyMeta = {
  function: Record<string, AmplifyMetaFunction>;
};

export const getFunctionDefinition = (
  functionConfigurations: FunctionConfiguration[],
  functionCategoryMap: Map<string, string>,
  meta: AmplifyMeta,
): FunctionDefinition[] => {
  const funcDefList: FunctionDefinition[] = [];

  for (const configuration of functionConfigurations) {
    const funcDef: FunctionDefinition = {};
    funcDef.entry = configuration?.Handler;
    funcDef.name = configuration?.FunctionName;
    funcDef.timeoutSeconds = configuration?.Timeout;
    funcDef.memoryMB = configuration?.MemorySize;
    funcDef.environment = configuration?.Environment;
    funcDef.runtime = configuration?.Runtime;
    const functionName = configuration?.FunctionName;
    assert(functionName);
    const functionRecordInMeta = Object.entries(meta.function).find(([_, value]) => value.output.Name === functionName);
    assert(functionRecordInMeta);
    funcDef.category = functionCategoryMap.get(functionRecordInMeta[0]) ?? 'function';
    funcDef.resourceName = functionRecordInMeta[0];

    funcDefList.push(funcDef);
  }

  return funcDefList;
};
