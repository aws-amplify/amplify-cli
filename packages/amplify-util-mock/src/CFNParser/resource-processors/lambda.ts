import { parseValue } from '../field-parser';
import { CloudFormationParseContext } from '../types';
import { CloudFormationProcessedResourceResult } from '../stack/types';

export type LambdaFunctionConfig = CloudFormationProcessedResourceResult & {
  name: string;
  handler: string;
  basePath?: string;
  environment?: object;
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
          {},
        )
      : {};
  return {
    cfnExposedAttributes: { Arn: 'arn' },
    arn: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
    ref: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
    name,
    handler,
    environment,
  };
}
