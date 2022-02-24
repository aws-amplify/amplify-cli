import { $TSAny, $TSContext, $TSObject, JSONUtilities, pathManager } from 'amplify-cli-core';
import { FunctionParameters } from 'amplify-function-plugin-interface';
import { getResourcesForCfn, generateEnvVariablesForCfn } from '../service-walkthroughs/execPermissionsWalkthrough';
import { updateCFNFileForResourcePermissions } from '../service-walkthroughs/lambda-walkthrough';
import { loadFunctionParameters } from './loadFunctionParameters';
import * as path from 'path';
import { functionParametersFileName } from './constants';
import { categoryName } from '../../../constants';


export async function updateMissingDependencyFunctionsCfn(
  context: $TSContext,
  dependentFunctionResource: $TSObject[],
  backendDir: string,
  existingModels: string[],
  apiResource: string,
) {
  // remove function parameters from if there is dependency
  /*
    1) get the List of functions
    2) check the functions parameters.json for dependency and api
    3) update CFN and functional parameters file if table is deleted.
    */
  // if the function is deleted -> not possible as have to remove api
  // initialize function parameters for update

  for (const lambda of dependentFunctionResource) {
    const resourceDirPath = path.join(backendDir, categoryName, lambda.resourceName);
    const currentParameters = loadFunctionParameters(resourceDirPath);
    const selectedCategories = currentParameters.permissions;
    let categoryPolicies = [];
    let permissions = {};
    let resources = [];
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

    if (selectedCategories) {
      for (const selectedCategory of Object.keys(selectedCategories)) {
        // update function parameters resouce parameters with deleted models data
        // remove the deleted @model
        const selectedResources = selectedCategories[selectedCategory];
        for (const resourceName of Object.keys(selectedResources)) {
          if (existingModels.includes(resourceName)) {
            const resourcePolicy = selectedResources[resourceName];
            const { permissionPolicies, cfnResources } = await getResourcesForCfn(
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
    const { environmentMap, dependsOn } = await generateEnvVariablesForCfn(context, resources, {});
    functionParameters.categoryPolicies = categoryPolicies;
    functionParameters.mutableParametersState = { permissions };
    functionParameters.environmentMap = environmentMap;
    functionParameters.dependsOn = dependsOn;
    functionParameters.lambdaLayers = currentParameters.lambdaLayers;
    updateCFNFileForResourcePermissions(resourceDirPath, functionParameters, currentParameters, apiResource);
    // In some cases, we need to ensure that API Dynamo event sources are removed when the model doesn't exist
    removeDeletedApiDynamoEventSourcesFromCfn(resourceDirPath, lambda.resourceName, existingModels);
    // assign new permissions to current permissions to update function-parameters file
    currentParameters.permissions = permissions;
    // update function-parameters file
    const parametersFilePath = path.join(resourceDirPath, functionParametersFileName);
    JSONUtilities.writeJson(parametersFilePath, currentParameters);
    // update dependsOn for lambda
    lambda.dependsOn = functionParameters.dependsOn;
    // update amplify-meta.json
    context.amplify.updateamplifyMetaAfterResourceUpdate(categoryName, lambda.resourceName, 'dependsOn', lambda.dependsOn);
  }
}

export function addAppSyncInvokeMethodPermission(
  functionName: string,
) {
  const resourceDirPath = pathManager.getResourceDirectoryPath(undefined, categoryName, functionName);
  const cfnFileName = `${functionName}-cloudformation-template.json`;
  const cfnFilePath = path.join(resourceDirPath, cfnFileName);
  const cfnContent = JSONUtilities.readJson<$TSAny>(cfnFilePath);

  if (!cfnContent?.Resources?.PermissionForAppSyncToInvokeLambda) {
    cfnContent.Resources.PermissionForAppSyncToInvokeLambda = {
      Type: 'AWS::Lambda::Permission',
      Properties: {
        FunctionName: {
          Ref: "LambdaFunction"
        },
        Action: "lambda:InvokeFunction",
        Principal: "appsync.amazonaws.com",
      },
    };
  }
  JSONUtilities.writeJson(cfnFilePath, cfnContent);
}

function removeDeletedApiDynamoEventSourcesFromCfn(
  resourceDirPath: string,
  resourceName: string,
  existingModels: string[],
) {
  const sanitizedExistingModels = existingModels.map(value => {
    return value.slice(0, value.indexOf(':'));
  });
  const cfnFilePath = path.join(resourceDirPath, `${resourceName}-cloudformation-template.json`);
  const functionCfn = JSONUtilities.readJson<$TSAny>(cfnFilePath);
  let tableDeletions: string[] = [];
  if (functionCfn?.Resources) {
    const triggerPolicyTables = Object.keys(functionCfn.Resources).filter(key => key.startsWith('LambdaTriggerPolicy'));
    for (let triggerPolicy of triggerPolicyTables) {
      const tableName = triggerPolicy.match(/(?<=LambdaTriggerPolicy)(.*)/g)?.[0];
      if (tableName && !sanitizedExistingModels.includes(tableName)) {
        const triggerPolicyStatement: $TSAny = functionCfn?.Resources?.[triggerPolicy]?.Properties?.PolicyDocument?.
          Statement;
        for (const statement of triggerPolicyStatement ?? []) {
          const apiIDCheckString: string = statement?.Resource?.['Fn::ImportValue']?.['Fn::Sub'];
          if (apiIDCheckString && apiIDCheckString.includes('GraphQLAPIId')) {
            tableDeletions.push(tableName);
            break;
          }
        }
      }
    }
  }

  for (let tableName of tableDeletions) {
    delete functionCfn?.Resources?.[`LambdaTriggerPolicy${tableName}`];
    delete functionCfn?.Resources?.[`LambdaEventSourceMapping${tableName}`];
  }
  JSONUtilities.writeJson(cfnFilePath, functionCfn);
}
