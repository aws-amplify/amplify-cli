import {
  $TSContext, stateManager, pathManager, readCFNTemplate, writeCFNTemplate, AmplifySupportedService,
} from 'amplify-cli-core';
import * as path from 'path';
import { categoryName } from '../constants';
import {
  FunctionSecretsStateManager,
  getLocalFunctionSecretNames,
  storeSecretsPendingRemoval,
} from '../provider-utils/awscloudformation/secrets/functionSecretsStateManager';
import { ensureEnvironmentVariableValues } from '../provider-utils/awscloudformation/utils/environmentVariablesHelper';

/**
 * prePush Handler event for function category
 */
export const prePushHandler = async (context: $TSContext): Promise<void> => {
  await ensureEnvironmentVariableValues(context);
  await ensureFunctionSecrets(context);
  await ensureLambdaExecutionRoleOutputs();
};

const ensureFunctionSecrets = async (context: $TSContext): Promise<void> => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);
  for (const funcName of functionNames) {
    if (getLocalFunctionSecretNames(funcName).length > 0) {
      const funcSecretsManager = await FunctionSecretsStateManager.getInstance(context);
      await funcSecretsManager.ensureNewLocalSecretsSyncedToCloud(funcName);
    }
  }
  await storeSecretsPendingRemoval(context, functionNames);
};

/**
 * updates function cfn stack with lambda execution role arn parameter
 */
export const ensureLambdaExecutionRoleOutputs = async (): Promise<void> => {
  const amplifyMeta = stateManager.getMeta();
  const functionNames = Object.keys(amplifyMeta?.[categoryName]);
  // filter lambda layer from lambdas in function
  const lambdaFunctionNames = functionNames.filter(functionName => {
    const functionObj = amplifyMeta?.[categoryName]?.[functionName];
    return functionObj.service === AmplifySupportedService.LAMBDA;
  });
  for (const functionName of lambdaFunctionNames) {
    const templateSourceFilePath = path.join(pathManager.getBackendDirPath(), categoryName, functionName, `${functionName}-cloudformation-template.json`);
    const { cfnTemplate } = readCFNTemplate(templateSourceFilePath);
    if (!cfnTemplate?.Outputs?.LambdaExecutionRoleArn) {
      cfnTemplate.Outputs.LambdaExecutionRoleArn = {
        Value: {
          'Fn::GetAtt': [
            'LambdaExecutionRole',
            'Arn',
          ],
        },
      };
      await writeCFNTemplate(cfnTemplate, templateSourceFilePath);
    }
  }
};
