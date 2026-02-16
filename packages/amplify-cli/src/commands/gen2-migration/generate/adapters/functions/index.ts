import { FunctionDefinition } from '../../core/migration-pipeline';
import { FunctionConfiguration } from '@aws-sdk/client-lambda';
import { AuthAccess } from '../../generators/functions/index';
import { analyzeApiPermissionsFromCfn } from '../../codegen-head/api-cfn-access';
import { DataModelAccessParser } from '../../codegen-head/data_model_access_parser';
import assert from 'node:assert';

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
  functionAuthAccess?: Map<string, AuthAccess>,
): FunctionDefinition[] => {
  const funcDefList: FunctionDefinition[] = [];

  for (const configuration of functionConfigurations) {
    const funcDef: FunctionDefinition = {};
    funcDef.entry = extractFilePathFromHandler(configuration?.Handler ?? 'index.js');
    funcDef.name = configuration?.FunctionName;
    funcDef.timeoutSeconds = configuration?.Timeout;
    funcDef.memoryMB = configuration?.MemorySize;

    // Store filtered environment variables for escape hatch generation
    const filteredEnvVars: Record<string, string> = {};

    // we remove these because their value points to the Gen1 values.
    // the correct value needs to come from `backend` attributes, which we don't have access to here
    // since `backend` is configured in a different file. we can't import that file because it would create
    // a circular import. instead, we need to generate some code in `backend.ts` (TODO)

    // api access env variables
    for (const envSuffix of ['GRAPHQLAPIKEYOUTPUT', 'GRAPHQLAPIENDPOINTOUTPUT', 'GRAPHQLAPIIDOUTPUT', 'TABLE_ARN', 'TABLE_NAME']) {
      for (const variable of Object.keys(configuration.Environment?.Variables ?? {})) {
        if (variable.startsWith('API_') && variable.endsWith(envSuffix)) {
          filteredEnvVars[variable] = configuration.Environment?.Variables?.[variable] ?? '';
          delete configuration.Environment?.Variables[variable];
        }
      }
    }

    // storage dynamo access env variables
    for (const envSuffix of ['ARN', 'NAME', 'STREAMARN']) {
      for (const variable of Object.keys(configuration.Environment?.Variables ?? {})) {
        if (variable.startsWith('STORAGE_') && variable.endsWith(envSuffix)) {
          filteredEnvVars[variable] = configuration.Environment?.Variables?.[variable] ?? '';
          delete configuration.Environment?.Variables[variable];
        }
      }
    }

    // storage s3 access env variables
    for (const envSuffix of ['BUCKETNAME']) {
      for (const variable of Object.keys(configuration.Environment?.Variables ?? {})) {
        if (variable.startsWith('STORAGE_') && variable.endsWith(envSuffix)) {
          filteredEnvVars[variable] = configuration.Environment?.Variables?.[variable] ?? '';
          delete configuration.Environment?.Variables[variable];
        }
      }
    }

    // auth access env variables
    for (const envSuffix of ['USERPOOLID']) {
      for (const variable of Object.keys(configuration.Environment?.Variables ?? {})) {
        if (variable.startsWith('AUTH_') && variable.endsWith(envSuffix)) {
          filteredEnvVars[variable] = configuration.Environment?.Variables?.[variable] ?? '';
          delete configuration.Environment?.Variables[variable];
        }
      }
    }

    funcDef.environment = configuration?.Environment;
    funcDef.filteredEnvironmentVariables = filteredEnvVars;
    funcDef.runtime = configuration?.Runtime;
    const functionName = configuration?.FunctionName;
    assert(functionName);
    const functionRecordInMeta = Object.entries(meta.function).find(([, value]) => value.output.Name === functionName);
    assert(functionRecordInMeta);
    funcDef.category = functionCategoryMap.get(functionRecordInMeta[0]) || 'function';
    funcDef.resourceName = functionRecordInMeta[0];
    funcDef.schedule = functionSchedules.find((schedule) => schedule.functionName === functionName)?.scheduleExpression;

    // Add auth access configuration if available
    if (functionAuthAccess?.has(functionRecordInMeta[0])) {
      funcDef.authAccess = functionAuthAccess.get(functionRecordInMeta[0]);
    }

    // Analyze CFN template for API permissions
    if (funcDef.resourceName) {
      funcDef.apiPermissions = analyzeApiPermissionsFromCfn(funcDef.resourceName);

      // Analyze CFN template for data model table access
      const dataModelAccess = DataModelAccessParser.extractFunctionDataModelAccess([funcDef.resourceName]);
      if (dataModelAccess.length > 0) {
        funcDef.dataModelAccess = dataModelAccess;
      }
    }

    funcDefList.push(funcDef);
  }

  return funcDefList;
};
