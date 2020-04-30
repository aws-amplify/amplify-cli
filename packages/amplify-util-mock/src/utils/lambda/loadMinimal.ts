import { LambdaFunctionConfig, processResources } from '../../CFNParser/lambda-resource-processor';
import * as path from 'path';

// Performs a minimal parsing of a lambda CFN.
export function loadMinimalLambdaConfig(context: any, resourceName: string, params: { [key: string]: string } = {}): LambdaFunctionConfig {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), 'function', resourceName);
  const cfn = context.amplify.readJsonFile(path.join(resourcePath, `${resourceName}-cloudformation-template.json`));

  return processResources(cfn.Resources, {}, params);
}
