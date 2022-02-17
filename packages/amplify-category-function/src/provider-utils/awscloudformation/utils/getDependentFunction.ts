import { $TSContext, $TSObject } from 'amplify-cli-core';
import * as path from 'path';
import { loadFunctionParameters, loadFunctionStackAsJSON } from './loadFunctionParameters';
import { ServiceName } from './constants';
import { categoryName } from '../../../constants';


export async function lambdasWithMissingApiDependency(
  context: $TSContext,
  allResources: $TSObject[],
  backendDir: string,
  existingModels: string[],
) {
  //get the List of functions dependent on deleted models
  let dependentFunctions = [];
  const lambdaFuncResources = allResources.filter(
    resource => {
      return resource.service === ServiceName.LambdaFunction &&
                resource.mobileHubMigrated !== true &&
                resource.dependsOn !== undefined &&
                resource.dependsOn.find(val => val.category === 'api');
    },
  );

  // initialize function parameters for update
  for (const lambda of lambdaFuncResources) {
    const resourceDirPath = path.join(backendDir, categoryName, lambda.resourceName);
    const currentParameters = loadFunctionParameters(resourceDirPath);
    const selectedCategories = currentParameters.permissions;
    let deletedModelFound: boolean;

    if (typeof selectedCategories === 'object' && selectedCategories !== null) {
      for (const selectedResources of Object.values(selectedCategories)) {
        deletedModelFound = Object.keys(selectedResources).some(r => !(existingModels.includes(r)));
        if (deletedModelFound) {
          dependentFunctions.push(lambda);
        }
      }
    }
    else {
      // In the case that the function-parameters.json does not have info on dependencies, we check the CFN stack.
      // If the dependency is only a dynamo stream trigger, we don't have info in function-parameters.json to work with
      const lambdaStackJson = loadFunctionStackAsJSON(resourceDirPath, lambda.resourceName);
      if(lambdaStackJson?.Resources) {
        const triggerPolicyTables = Object.keys(lambdaStackJson.Resources).filter(key => key.startsWith("LambdaTriggerPolicy"));
        for(let triggerPolicy of triggerPolicyTables) {
          const tableName = triggerPolicy.match(/(?<=LambdaTriggerPolicy)(.*)/g)?.[0];
          if(!existingModels.includes(tableName)) {
            dependentFunctions.push(lambda);
          }
        }
      }
    }
  }
  return dependentFunctions;
}
