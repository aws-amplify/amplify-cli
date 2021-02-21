import { $TSContext, $TSObject, JSONUtilities } from 'amplify-cli-core';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { getResourcesforCfn, generateEnvVariablesforCfn } from '../service-walkthroughs/execPermissionsWalkthrough';
import { updateCFNFileForResourcePermissions } from '../service-walkthroughs/lambda-walkthrough';
import { loadFunctionParameters } from './loadFunctionParameters';
import path from 'path';
import { functionParametersFileName, ServiceName } from './constants';
import { category } from '../../../constants';

export async function updateDepedentFunctionsCfn(
  context: $TSContext,
  allResources: $TSObject[],
  backendDir: string,
  modelsDeleted: string[],
  apiResource: string,
) {
  // remove function parameters from if there is dependency
  /*
    1) get tyhe List of functions
    2) check the functions parameters.json for dependency and api
    3) update CFN and functional parameters file if table is deleted.
    */
  // if the function is deleted -> not possible as have to remove api
  let functionMetaToBeUpdated = [];
  const lambdaFuncResourceNames = allResources.filter(
    resource =>
      resource.service === ServiceName.LambdaFunction &&
      resource.mobileHubMigrated !== true &&
      resource.dependsOn.find(val => val.category === 'api'),
  );

  // initialize function parameters for update
  for (let lambda of lambdaFuncResourceNames) {
    const resourceDirPath = path.join(backendDir, category, lambda.resourceName);
    const currentParameters = loadFunctionParameters(context, resourceDirPath);
    const selectedCategories = currentParameters.permissions;
    let categoryPolicies = [];
    let permissions = {};
    let resources = [];
    let resourcePolicy = {};
    let deletedModelFound: boolean = true;
    const functionParameters: Partial<FunctionParameters> = {
      resourceName: lambda.resourceName,
      environmentMap: {
        ENV: {
          Ref: 'env',
        },
        REGION: {
          Ref: 'AWS::Region',
        },
      },
    };

    for (const selectedCategory of Object.keys(selectedCategories)) {
      // update function parameters resouce parameters with deleted models data
      // remove the deleted @model
      const selectedResources = selectedCategories[selectedCategory];
      // check for @model depedency on function , if found then generate new policies removing deleted model
      deletedModelFound = Object.keys(selectedResources).some(r => modelsDeleted.indexOf(r) >= 0);
      if (deletedModelFound) {
        for (const resourceName of Object.keys(selectedResources)) {
          if (!modelsDeleted.includes(resourceName)) {
            resourcePolicy = selectedResources[resourceName];
            const { permissionPolicies, cfnResources } = await getResourcesforCfn(
              context,
              resourceName,
              resourcePolicy,
              apiResource,
              selectedCategory,
            );
            categoryPolicies = categoryPolicies.concat(permissionPolicies);
            if (!permissions[selectedCategory]) {
              permissions[selectedCategory] = {};
            }
            permissions[selectedCategory][resourceName] = resourcePolicy;
            resources = resources.concat(cfnResources);
          }
        }
      }
    }
    if (deletedModelFound) {
      const { environmentMap, dependsOn } = await generateEnvVariablesforCfn(context, resources, {});
      functionParameters.categoryPolicies = categoryPolicies;
      functionParameters.mutableParametersState = { permissions };
      functionParameters.environmentMap = environmentMap;
      functionParameters.dependsOn = dependsOn;
      functionParameters.lambdaLayers = currentParameters.lambdaLayers;
      updateCFNFileForResourcePermissions(resourceDirPath, functionParameters, currentParameters, apiResource);
      // assign new permissions to current permissions to update function-parameters file
      currentParameters.permissions = permissions;
      //update function-parameters file
      const parametersFilePath = path.join(resourceDirPath, functionParametersFileName);
      JSONUtilities.writeJson(parametersFilePath, currentParameters);
      // update depensON for lambda
      lambda.dependsOn = functionParameters.dependsOn;
      functionMetaToBeUpdated.push(lambda);
      // update amplify-meta.json
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, lambda.resourceName, 'dependsOn', lambda.dependsOn);
    }
  }
  return functionMetaToBeUpdated;
}
