import { $TSContext, $TSObject } from 'amplify-cli-core';
import * as path from 'path';
import { loadFunctionParameters } from './loadFunctionParameters';
import { ServiceName } from './constants';
import { categoryName } from '../../../constants';

export async function lambdasWithApiDependency(
  context: $TSContext,
  allResources: $TSObject[],
  backendDir: string,
  modelsDeleted: string[],
) {
  //get the List of functions dependent on deleted model
  let dependentFunctions = [];
  const lambdaFuncResources = allResources.filter(
    resource =>
      resource.service === ServiceName.LambdaFunction &&
      resource.mobileHubMigrated !== true &&
      resource.dependsOn !== undefined &&
      resource.dependsOn.find(val => val.category === 'api'),
  );

  // initialize function parameters for update
  for (const lambda of lambdaFuncResources) {
    const resourceDirPath = path.join(backendDir, categoryName, lambda.resourceName);
    const currentParameters = loadFunctionParameters(resourceDirPath);
    const selectedCategories = currentParameters.permissions;
    let deletedModelFound: boolean;

    for (const selectedResources of Object.values(selectedCategories)) {
      deletedModelFound = Object.keys(selectedResources).some(r => modelsDeleted.includes(r));
      if (deletedModelFound) {
        dependentFunctions.push(lambda);
      }
    }
  }
  return dependentFunctions;
}
