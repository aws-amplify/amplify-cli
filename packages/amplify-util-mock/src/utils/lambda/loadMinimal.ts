import { JSONUtilities, pathManager, stateManager, $TSAny } from 'amplify-cli-core';
import { LambdaFunctionConfig, processResources } from '../../CFNParser/lambda-resource-processor';
import * as path from 'path';

// Performs a minimal parsing of a lambda CFN.
export function loadMinimalLambdaConfig(resourceName: string, params: { [key: string]: string } = {}): LambdaFunctionConfig {
  const resourcePath = path.join(pathManager.getBackendDirPath(), 'function', resourceName);
  const cfn = JSONUtilities.readJson<$TSAny>(path.join(resourcePath, `${resourceName}-cloudformation-template.json`));
  const projectMeta = stateManager.getMeta();
  let extendedParams: $TSAny = {};
  if (projectMeta.function[resourceName].dependsOn) {
    extendedParams = projectMeta.function[resourceName].dependsOn.reduce((ini, depend) => {
      depend.attributes.forEach(attribute => {
        const val = projectMeta[depend.category][depend.resourceName].output[attribute];
        ini[depend.category + depend.resourceName + attribute] = val;
      });
      return ini;
    }, {});
  }
  return processResources(cfn.Resources, { ...params, ...extendedParams });
}
