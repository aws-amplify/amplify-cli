import { $TSAny, $TSContext, $TSObject, pathManager } from 'amplify-cli-core';
import path from 'path';
import * as TransformPackage from 'graphql-transformer-core';

export async function removeDependencyOnFunctions(
  context: $TSContext,
  apiResource: $TSObject,
  allResources: $TSObject[],
): Promise<$TSObject[]> {
  // get #current-cloud-backed and cloud backend schema.graphql
  let dependentFunctionResource;
  const backendDir = pathManager.getBackendDirPath();
  const currentBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const modelsDeleted = await getSchemaDiff(currentBackendDir, backendDir, apiResource[0].resourceName);
  if (modelsDeleted.length) {
    dependentFunctionResource = await context.amplify.invokePluginMethod(context, 'function', undefined, 'lambdasWithApiDependency', [
      context,
      allResources,
      backendDir,
      modelsDeleted,
    ]);
    if (dependentFunctionResource.length) {
      const dependentFunctionsNames = dependentFunctionResource.map(lambda => lambda.resourceName);
      context.print.info('');

      context.print.warning(`Functions ${dependentFunctionsNames} have access to removed GraphQL API model(s) ${modelsDeleted}`);

      const continueToPush = !!context?.exeInfo?.inputParams?.yes;

      if (
        !continueToPush &&
        (await context.amplify.confirmPrompt('Do you want to remove the GraphQL model access on these affected functions?', false))
      ) {
        await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
          context,
          dependentFunctionResource,
          backendDir,
          modelsDeleted,
          apiResource[0].resourceName,
        ]);
      } else {
        throw new Error(
          `In order to successfully deploy. Run “amplify update function” on the affected functions${dependentFunctionsNames} and remove the access permission to ${modelsDeleted}.`,
        );
      }
    }
    return dependentFunctionResource;
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
