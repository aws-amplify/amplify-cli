import { LambdaFunctionConfig, processResources } from '../../CFNParser/lambda-resource-processor';
import * as path from 'path';

// Performs a minimal parsing of a lambda CFN.
export function loadMinimalLambdaConfig(context: any, resourceName: string, params: { [key: string]: string } = {}): LambdaFunctionConfig {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), 'function', resourceName);
  const cfn = context.amplify.readJsonFile(path.join(resourcePath, `${resourceName}-cloudformation-template.json`));
  const projectMeta = context.amplify.getProjectMeta();
  let extendedParams: any = {};
  if (projectMeta.function[resourceName].dependsOn) {
    extendedParams = projectMeta.function[resourceName].dependsOn.reduce((ini, depend) => {
      depend.attributes.forEach(attribute => {
        const dependsOnResourceMeta = projectMeta[depend.category][depend.resourceName];
        if (dependsOnResourceMeta.output !== undefined) {
          const val = dependsOnResourceMeta.output[attribute];
          ini[depend.category + depend.resourceName + attribute] = val;
        }
      });
      return ini;
    }, {});
  }
  return processResources(cfn.Resources, {}, { ...params, ...extendedParams });
}
