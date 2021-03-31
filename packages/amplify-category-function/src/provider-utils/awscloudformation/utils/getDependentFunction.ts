import { $TSContext, $TSObject } from 'amplify-cli-core';
import { loadFunctionParameters } from './loadFunctionParameters';
import path from 'path';
import { ServiceName } from './constants';
import { category } from '../../../constants';

export async function getDependentFunctionsCfn(
  context: $TSContext,
  allResources: $TSObject[],
  backendDir: string,
  modelsDeleted: string[],
) {
  //get the List of functions dependent on deleted model
  let functionNamesToBeUpdated = [];
  const lambdaFuncResources = allResources.filter(
    resource =>
      resource.service === ServiceName.LambdaFunction &&
      resource.mobileHubMigrated !== true &&
      resource.dependsOn.find(val => val.category === 'api'),
  );

  // initialize function parameters for update
  for (let lambda of lambdaFuncResources) {
    const resourceDirPath = path.join(backendDir, category, lambda.resourceName);
    const currentParameters = loadFunctionParameters(context, resourceDirPath);
    const selectedCategories = currentParameters.permissions;
    let deletedModelFound: boolean = true;

    for (const selectedCategory of Object.keys(selectedCategories)) {
      const selectedResources = selectedCategories[selectedCategory];
      deletedModelFound = Object.keys(selectedResources).some(r => modelsDeleted.indexOf(r) >= 0);
      if (deletedModelFound) {
        functionNamesToBeUpdated.push(lambda.resourceName);
      }
    }
  }
  return functionNamesToBeUpdated;
}
