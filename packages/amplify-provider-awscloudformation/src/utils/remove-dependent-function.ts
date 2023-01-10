import { $TSAny, $TSContext, $TSObject, AmplifyError, pathManager } from 'amplify-cli-core';
import path from 'path';
import { readProjectConfiguration, collectDirectivesByTypeNames, getTableNameForModel } from 'graphql-transformer-core';

/**
 * ensures valid function model dependencies
 */
export const ensureValidFunctionModelDependencies = async (
  context: $TSContext,
  apiResource: $TSObject,
  allResources: $TSObject[],
): Promise<$TSObject[]> => {
  // get #current-cloud-backed and cloud backend schema.graphql
  const backendDir = pathManager.getBackendDirPath();
  const currentBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const tablesDeleted = await getTableNameDiff(currentBackendDir, backendDir, apiResource[0].resourceName);
  if (tablesDeleted.length === 0) {
    return undefined;
  }
  const dependentFunctionResource = await context.amplify.invokePluginMethod<any[]>(
    context,
    'function',
    undefined,
    'lambdasWithApiDependency',
    [context, allResources, backendDir, tablesDeleted],
  );
  if (dependentFunctionResource.length === 0) {
    return dependentFunctionResource;
  }
  const dependentFunctionsNames = dependentFunctionResource.map(lambda => lambda.resourceName);
  context.print.info('');
  context.print.warning(`Functions ${dependentFunctionsNames} have access to removed GraphQL API model(s) ${tablesDeleted}`);

  const continueToPush = !!context?.exeInfo?.inputParams?.yes;
  const forcePush = !!context?.exeInfo?.forcePush;
  const continueForcePush = continueToPush && forcePush;

  if (continueForcePush) {
    await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
      context,
      dependentFunctionResource,
      backendDir,
      tablesDeleted,
      apiResource[0].resourceName,
    ]);
  } else if (
    !continueToPush &&
    (await context.amplify.confirmPrompt('Do you want to remove the GraphQL model access on these affected functions?', false))
  ) {
    await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
      context,
      dependentFunctionResource,
      backendDir,
      tablesDeleted,
      apiResource[0].resourceName,
    ]);
  } else {
    throw new AmplifyError('DeploymentError', {
      message: 'Failed to resolve appId.',
      resolution: `Run “amplify update function” on the affected functions ${dependentFunctionsNames} and remove the access permission to ${tablesDeleted}.`,
    });
  }
  return dependentFunctionResource;
};

const getTableNameDiff = async (currentBackendDir: string, backendDir: string, apiResourceName: string): Promise<string[]> => {
  const deployedModelNames = await getTableNames(currentBackendDir, apiResourceName);
  const currentModelNames = await getTableNames(backendDir, apiResourceName);
  const modelsDeleted = deployedModelNames.filter(val => !currentModelNames.includes(val));
  return modelsDeleted;
};

const getTableNames = async (backendDir: string, apiResourceName: string): Promise<string[]> => {
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
};
