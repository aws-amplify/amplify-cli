import { $TSAny, $TSContext, $TSObject, pathManager } from 'amplify-cli-core';
import path from 'path';
import * as TransformPackage from 'graphql-transformer-core';

export async function removeDependencyOnFunctions(
  context: $TSContext,
  apiResource: $TSObject,
  allResources: $TSObject[],
): Promise<$TSObject[]> {
  // get #current-cloud-backed and cloud backend schema.graphql
  let functionResource;
  let functionResourceNames;
  const backendDir = pathManager.getBackendDirPath();
  const currentBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const modelsDeleted = await getSchemaDiff(currentBackendDir, backendDir, apiResource[0].resourceName);
  if (modelsDeleted.length) {
    functionResourceNames = await context.amplify.invokePluginMethod(context, 'function', undefined, 'getDependentFunctions', [
      context,
      allResources,
      backendDir,
      modelsDeleted,
    ]);
    if (functionResourceNames.length) {
      context.print.info('');

      context.print.warning(`Functions ${functionResourceNames} have access to a removed GraphQL API model(s) ${modelsDeleted}`);

      let continueToPush = context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes;
      let forcePush = context?.exeInfo?.forcePush;

      if (!continueToPush && !forcePush) {
        continueToPush = await context.amplify.confirmPrompt(
          'Do you want to remove the GraphQL model access on these affected functions?',
          false,
        );
      }
      if (continueToPush || forcePush) {
        functionResource = await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
          context,
          allResources,
          backendDir,
          modelsDeleted,
          apiResource[0].resourceName,
        ]);
      } else {
        throw new Error(
          `In order to successfully deploy. Run “amplify update function” on the affected functions${functionResourceNames} and remove the access permission to ${modelsDeleted}.`,
        );
      }
    }
    return functionResource;
  }
}

export async function getSchemaDiff(currentBackendDir: string, backendDir: string, apiResourceName: string) {
  const deployedModelNames = await getDeployedModelNames(currentBackendDir, apiResourceName);
  const currentModelNames = await getDeployedModelNames(backendDir, apiResourceName);
  const modelsDeleted = deployedModelNames.filter(val => !currentModelNames.includes(val));
  return modelsDeleted;
}

export async function getDeployedModelNames(backendDir: string, apiResourceName: string) {
  // need all object type name definition node with @model directives present
  const appsyncTableSuffix = '@model(appsync)';
  const resourceDirPath = path.join(backendDir, 'api', apiResourceName);
  const project = await TransformPackage.readProjectConfiguration(resourceDirPath);
  const directivesMap: $TSAny = TransformPackage.collectDirectivesByTypeNames(project.schema);
  const modelNames = Object.keys(directivesMap.types)
    .filter(typeName => directivesMap.types[typeName].includes('model'))
    .map(modelName => `${modelName}:${appsyncTableSuffix}`);
  return modelNames;
}
