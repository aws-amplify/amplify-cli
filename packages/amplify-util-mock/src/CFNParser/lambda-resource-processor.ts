import { CloudFormationParseContext } from './types';
import { parseValue } from './field-parser';

export type LambdaFunctionConfig = {
  name: string;
  handler: string;
  basePath?: string;
  environment?: object;
};

const CFN_DEFAULT_PARAMS = {
  'AWS::Region': 'us-east-1-fake',
  'AWS::AccountId': '12345678910',
  'AWS::StackId': 'fake-stackId',
  'AWS::StackName': 'local-testing',
};

const CFN_DEFAULT_CONDITIONS = {
  ShouldNotCreateEnvResources: true,
};

export function lambdaFunctionHandler(resourceName, resource, cfnContext: CloudFormationParseContext): LambdaFunctionConfig {
  const name: string = parseValue(resource.Properties.FunctionName, cfnContext);
  const handler = parseValue(resource.Properties.Handler, cfnContext);
  const environment =
    resource.Properties.Environment && resource.Properties.Environment.Variables
      ? Object.entries(resource.Properties.Environment.Variables).reduce(
          (acc, [varName, varValue]) => ({
            ...acc,
            [varName]: parseValue(varValue, cfnContext),
          }),
          {}
        )
      : {};
  return {
    name,
    handler,
    environment,
  };
}

export function processResources(resources: { [key: string]: any }, transformResult: any, params = {}): LambdaFunctionConfig | undefined {
  const definition = Object.entries(resources).find((entry: [string, any]) => entry[1].Type === 'AWS::Lambda::Function');
  if (definition) {
    return lambdaFunctionHandler(definition[0], definition[1], {
      conditions: CFN_DEFAULT_CONDITIONS,
      params: { ...CFN_DEFAULT_PARAMS, ...params },
      exports: {},
      resources: {},
    });
  }
}
