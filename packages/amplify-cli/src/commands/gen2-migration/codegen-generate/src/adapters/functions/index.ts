import { FunctionDefinition } from '../../core/migration-pipeline';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';
import assert from 'node:assert';

const ENV_VARIABLES_TO_REMOVE = [
  // we remove these because their value points to the Gen1 appsync API.
  // we need to point to the new one.
  'GRAPHQLAPIKEYOUTPUT',
  'GRAPHQLAPIENDPOINTOUTPUT',
  'GRAPHQLAPIIDOUTPUT',
];

export type AmplifyMetaFunction = {
  service: string;
  providerPlugin: 'awscloudformation';
  output: Record<string, string>;
};

type FunctionSchedule = {
  functionName: string;
  scheduleExpression: string | undefined;
};

export type AmplifyMetaWithFunction = {
  function: Record<string, AmplifyMetaFunction>;
};

/**
 * Extracts the file path from an AWS Lambda handler string.
 * Converts handler strings like "index.handler" or "src/handler.myFunction"
 * to file paths like "./index.js" or "./src/handler.js".
 *
 * @param handler - The AWS Lambda handler string (e.g., "index.handler", "src/handler.myFunction")
 * @returns The file path with .js extension (e.g., "./index.js", "./src/handler.js")
 */
const extractFilePathFromHandler = (handler: string): string => {
  // Split on the last dot to separate file path from function name
  const lastDotIndex = handler.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // No dot found, treat the whole string as the file path
    return `./${handler}.js`;
  }

  // Extract the file path part (everything before the last dot)
  const filePath = handler.substring(0, lastDotIndex);
  return `./${filePath}.js`;
};

export const getFunctionDefinition = (
  functionConfigurations: FunctionConfiguration[],
  functionSchedules: FunctionSchedule[],
  functionCategoryMap: Map<string, string>,
  meta: AmplifyMetaWithFunction,
): FunctionDefinition[] => {
  const funcDefList: FunctionDefinition[] = [];

  for (const configuration of functionConfigurations) {
    const funcDef: FunctionDefinition = {};
    funcDef.entry = extractFilePathFromHandler(configuration?.Handler ?? 'index.js');
    funcDef.name = configuration?.FunctionName;
    funcDef.timeoutSeconds = configuration?.Timeout;
    funcDef.memoryMB = configuration?.MemorySize;

    // we remove these because their value points to the Gen1 appsync API.
    // the correct value needs to come from `backend.data` attributes, which we don't have access to here
    // since `backend` is configured in a different file. we can't import that file because it would create
    // a circular import. instead, we need to generate some code in `backend.ts` (TODO)
    for (const envSuffix of ['GRAPHQLAPIKEYOUTPUT', 'GRAPHQLAPIENDPOINTOUTPUT', 'GRAPHQLAPIIDOUTPUT']) {
      for (const variable of Object.keys(configuration.Environment?.Variables ?? {})) {
        if (variable.endsWith(envSuffix)) {
          delete configuration.Environment?.Variables[variable];
        }
      }
    }

    funcDef.environment = configuration?.Environment;
    funcDef.runtime = configuration?.Runtime;
    const functionName = configuration?.FunctionName;
    assert(functionName);
    const functionRecordInMeta = Object.entries(meta.function).find(([, value]) => value.output.Name === functionName);
    assert(functionRecordInMeta);
    funcDef.category = functionCategoryMap.get(functionRecordInMeta[0]) ?? 'function';
    funcDef.resourceName = functionRecordInMeta[0];
    funcDef.schedule = functionSchedules.find((schedule) => schedule.functionName === functionName)?.scheduleExpression;

    funcDefList.push(funcDef);
  }

  return funcDefList;
};
