import { $TSAny, $TSContext, $TSObject, pathManager } from 'amplify-cli-core';
import path from 'path';
import { readProjectConfiguration, collectDirectivesByTypeNames, getTableNameForModel } from 'graphql-transformer-core';

export async function ensureValidFunctionModelDependencies(
  context: $TSContext,
  apiResource: $TSObject,
  allResources: $TSObject[],
): Promise<$TSObject[]> {
  // get #current-cloud-backed and cloud backend schema.graphql
  let dependentFunctionResource;
  const backendDir = pathManager.getBackendDirPath();
  const backendTables = await getTableNames(backendDir, apiResource[0].resourceName);
  if (backendTables.length === 0) {
    return dependentFunctionResource;
  } else {
    dependentFunctionResource = await context.amplify.invokePluginMethod(context, 'function', undefined, 'lambdasWithMissingApiDependency', [
      context,
      allResources,
      backendDir,
      backendTables,
    ]);
    if (dependentFunctionResource.length === 0) {
      return dependentFunctionResource;
    } else {
      const dependentFunctionsNames = dependentFunctionResource.map(lambda => lambda.resourceName);
      context.print.info('');

      context.print.warning(`Functions ${dependentFunctionsNames} have access to removed GraphQL API model(s)`);

      const continueToPush = !!context?.exeInfo?.inputParams?.yes;
      const forcePush = !!context?.exeInfo?.forcePush;
      const continueForcePush = continueToPush && forcePush;

      if (continueForcePush) {
        await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateMissingDependencyFunctionsCfn', [
          context,
          dependentFunctionResource,
          backendDir,
          backendTables,
          apiResource[0].resourceName,
        ]);
      } else {
        if (
          !continueToPush &&
          (await context.amplify.confirmPrompt('Do you want to remove the GraphQL model access on these affected functions?', false))
        ) {
          await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateMissingDependencyFunctionsCfn', [
            context,
            dependentFunctionResource,
            backendDir,
            backendTables,
            apiResource[0].resourceName,
          ]);
        } else {
          throw new Error(
            `In order to successfully deploy. Run “amplify update function” on the affected functions ${dependentFunctionsNames} and remove the access permission to any removed tables.`,
          );
        }
      }
      return dependentFunctionResource;
    }
  }
}

async function getTableNames(backendDir: string, apiResourceName: string) {
  // need all object type name definition node with @model directives present
  const appsyncTableSuffix = '@model(appsync)';
  const resourceDirPath = path.join(backendDir, 'api', apiResourceName);
  const project = await readProjectConfiguration(resourceDirPath);
  const directivesMap: $TSAny = collectDirectivesByTypeNames(project.schema);
  const modelNames = Object.keys(directivesMap.types).filter(typeName => directivesMap.types[typeName].includes('model'));
  const tableNames = modelNames
    .map(modelName => getTableNameForModel(project.schema, modelName))
    .map(modelName => `${modelName}:${appsyncTableSuffix}`);
  return tableNames;
}
