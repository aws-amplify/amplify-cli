import { JSONUtilities, pathManager, $TSAny, $TSContext, $TSObject } from 'amplify-cli-core';
import { lambdaFunctionHandler } from '../../CFNParser/resource-processors/lambda';
import * as path from 'path';
import { populateCfnParams } from './populate-cfn-params';
import { ProcessedLambdaFunction } from '../../CFNParser/stack/types';
import detect from 'detect-port';
import { MOCK_API_PORT } from '../../api/api';
import { populateLambdaMockEnvVars } from './populate-lambda-mock-env-vars';

const CFN_DEFAULT_CONDITIONS = {
  ShouldNotCreateEnvResources: true,
};

/**
 * Loads the necessary parameters for mocking a lambda function
 *
 * Locates and parses the CFN template for the function and injects environment variables
 * @param resourceName The labmda resource to load
 * @param print The print object from context
 */
export const loadLambdaConfig = async (
  context: $TSContext,
  resourceName: string,
  overrideApiToLocal = false,
): Promise<ProcessedLambdaFunction> => {
  overrideApiToLocal = overrideApiToLocal || (await isApiRunning());
  const resourcePath = path.join(pathManager.getBackendDirPath(), 'function', resourceName);
  const { Resources: cfnResources } = JSONUtilities.readJson<{ Resources: $TSObject }>(
    path.join(resourcePath, `${resourceName}-cloudformation-template.json`),
  );
  const lambdaDef = Object.entries(cfnResources).find(([_, resourceDef]: [string, $TSAny]) => resourceDef.Type === 'AWS::Lambda::Function');
  if (!lambdaDef) {
    return undefined;
  }
  const cfnParams = populateCfnParams(resourceName, overrideApiToLocal);
  const processedLambda = lambdaFunctionHandler(lambdaDef[0], lambdaDef[1], {
    conditions: CFN_DEFAULT_CONDITIONS,
    params: cfnParams,
    exports: {},
    resources: {},
  });
  await populateLambdaMockEnvVars(context, processedLambda);
  return processedLambda;
};

const isApiRunning = async (): Promise<boolean> => {
  const result = await detect(MOCK_API_PORT);
  // returns the next free port so if the API is running, then the port will be different
  return result !== MOCK_API_PORT;
};
