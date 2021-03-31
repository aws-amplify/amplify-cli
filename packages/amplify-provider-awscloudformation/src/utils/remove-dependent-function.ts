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
    functionResourceNames = await context.amplify.invokePluginMethod(context, 'function', undefined, 'getDependentFunctionsCfn', [
      context,
      allResources,
      backendDir,
      modelsDeleted,
    ]);

    // if(functionResourceNames.length){
    //   const authSelectionQuestion = {
    //     type: 'select',
    //     name: 'authSelections',
    //     message: 'What type of auth resource do you want to import?',
    //     choices: [
    //       { name: 'Cognito User Pool and Identity Pool', value: 'identityPoolAndUserPool' },
    //       { name: 'Cognito User Pool only', value: 'userPoolOnly' },
    //     ],
    //     result(value: string) {
    //       return (this as any).focused.value;
    //     },
    //     initial: 0,
    //   };

    //   const { authSelections } = await enquirer.prompt(authSelectionQuestion as any); // any case needed because async validation TS definition is not up to date
    //   answers.authSelections = authSelections!;
    // }

    functionResource = await context.amplify.invokePluginMethod(context, 'function', undefined, 'updateDependentFunctionsCfn', [
      context,
      allResources,
      backendDir,
      modelsDeleted,
      apiResource[0].resourceName,
    ]);
  }
  return functionResource;
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
