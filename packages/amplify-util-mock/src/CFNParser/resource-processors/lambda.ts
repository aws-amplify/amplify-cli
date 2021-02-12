import { CloudFormationParseContext } from '../types';
import { parseValue } from '../field-parser';
import { CloudFormationResource, CloudFormationResourceProperty, ProcessedLambdaFunction } from '../stack/types';

/**
 * Handles the parsing of a lambda CFN resource into relevant bits of information
 * @param _ (resourceName) not used, but required to satisfy the CloudFormationResourceProcessorFn interface
 * @param resource The CFN resource as a JSON object
 * @param cfnContext The parameters, exports and other context required to parse the CFN
 */
export const lambdaFunctionHandler = (
  _,
  resource: CloudFormationResource,
  cfnContext: CloudFormationParseContext,
): ProcessedLambdaFunction => {
  const name: string = parseValue(resource.Properties.FunctionName, cfnContext);
  const handler = parseValue(resource.Properties.Handler, cfnContext);
  const cfnEnvVars = (resource?.Properties?.Environment as CloudFormationResourceProperty)?.Variables || {};
  const environment = Object.entries(cfnEnvVars).reduce(
    (acc, [varName, varVal]) => ({
      ...acc,
      [varName]: parseValue(varVal, cfnContext),
    }),
    {} as Record<string, string>,
  );
  return {
    cfnExposedAttributes: { Arn: 'arn' },
    arn: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
    ref: `arn:aws:lambda:{aws-region}:{aws-account-number}:function/${name}/LATEST`,
    name,
    handler,
    environment,
  };
};
