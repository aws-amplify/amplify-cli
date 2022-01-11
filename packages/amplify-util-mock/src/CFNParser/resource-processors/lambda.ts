import { CloudFormationParseContext } from '../types';
import { parseValue } from '../field-parser';
import {
  CloudFormationResource,
  CloudFormationResourceProperty,
  ProcessedLambdaEventSource,
  ProcessedLambdaFunction,
} from '../stack/types';

/**
 * Handles the parsing of a lambda CFN resource into relevant bits of information
 * @param _ (resourceName) not used, but required to satisfy the CloudFormationResourceProcessorFn interface
 * @param resource The CFN resource as a JSON object
 * @param cfnContext The parameters, exports and other context required to parse the CFN
 */
export const lambdaFunctionHandler = (
  resourceName,
  resource: CloudFormationResource,
  cfnContext: CloudFormationParseContext,
): ProcessedLambdaFunction => {
  // Use the resource name as a fallback in case the optional functionName is not present in CFN.
  const name: string = parseValue(resource.Properties.FunctionName ?? resourceName, cfnContext);
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

export const lambdaEventSourceHandler = (
  resourceName: string,
  resource: CloudFormationResource,
  cfnContext: CloudFormationParseContext,
): ProcessedLambdaEventSource => {
  const batchSize: number = parseValue(resource.Properties.BatchSize, cfnContext);
  const eventSourceArn: string = parseValue(resource.Properties.EventSourceArn, cfnContext);
  const functionName: string = parseValue(resource.Properties.FunctionName, cfnContext);
  const startingPosition: string = parseValue(resource.Properties.StartingPosition, cfnContext);

  return {
    cfnExposedAttributes: {},
    batchSize,
    eventSourceArn,
    functionName,
    startingPosition,
  };
};
