import {
  AmplifyCategories,
  AmplifySupportedService,
  pathManager,
  readCFNTemplate,
  stateManager,
  writeCFNTemplate,
} from '@aws-amplify/amplify-cli-core';
import * as path from 'path';

/**
 * updates function cfn stack with lambda execution role arn parameter
 */
export const ensureLambdaExecutionRoleOutputs = async (): Promise<void> => {
  const backendConfig = stateManager.getBackendConfig(undefined, {
    throwIfNotExist: false,
  });
  const functionNames = Object.keys(backendConfig?.[AmplifyCategories.FUNCTION] ?? []);
  // filter lambda layer from lambdas in function
  const lambdaFunctionNames = functionNames.filter((functionName) => {
    const functionObj = backendConfig?.[AmplifyCategories.FUNCTION]?.[functionName];
    return functionObj.service === AmplifySupportedService.LAMBDA;
  });
  for (const functionName of lambdaFunctionNames) {
    const templateSourceFilePath = path.join(
      pathManager.getBackendDirPath(),
      AmplifyCategories.FUNCTION,
      functionName,
      `${functionName}-cloudformation-template.json`,
    );
    const { cfnTemplate } = readCFNTemplate(templateSourceFilePath);
    if (cfnTemplate.Outputs !== undefined && !cfnTemplate?.Outputs?.LambdaExecutionRoleArn) {
      cfnTemplate.Outputs.LambdaExecutionRoleArn = {
        Value: {
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        },
      };
      await writeCFNTemplate(cfnTemplate, templateSourceFilePath);
    }
  }
};
